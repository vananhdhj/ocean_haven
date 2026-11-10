/* ============================================================
   Ocean Haven Hotel — SQL Server schema
   Target: SQL Server 2025 Developer Edition (VECTOR type needed for 05_semantic_search.sql)

   Ownership split (hybrid architecture):
     - Supabase  : authentication + public.users (id, email, role)
     - SQL Server: rooms, bookings, payments, booking history, room embeddings

   bookings.user_id holds the Supabase auth user id. There is no FK because
   the users table lives in another database.

   WARNING: re-running this file drops and recreates every table (dev reset).
   ============================================================ */

IF DB_ID(N'OceanHaven') IS NULL
    CREATE DATABASE OceanHaven;
GO

USE OceanHaven;
GO

/* ---------- Drop in dependency order so the script is re-runnable ---------- */
DROP TABLE IF EXISTS dbo.room_embeddings;
DROP TABLE IF EXISTS dbo.history_booking;
DROP TABLE IF EXISTS dbo.payments;
DROP TABLE IF EXISTS dbo.bookings;
DROP TABLE IF EXISTS dbo.room_amenities;
DROP TABLE IF EXISTS dbo.amenities;
DROP TABLE IF EXISTS dbo.room_images;
DROP TABLE IF EXISTS dbo.rooms;
DROP TABLE IF EXISTS dbo.bed_types;
DROP TABLE IF EXISTS dbo.view_types;
DROP TABLE IF EXISTS dbo.room_types;
GO

/* ============================================================
   LOOKUP TABLES
   ============================================================ */
CREATE TABLE dbo.room_types (
    id   VARCHAR(50)   NOT NULL CONSTRAINT PK_room_types PRIMARY KEY,
    name NVARCHAR(100) NOT NULL CONSTRAINT UQ_room_types_name UNIQUE
);

CREATE TABLE dbo.view_types (
    id   VARCHAR(50)   NOT NULL CONSTRAINT PK_view_types PRIMARY KEY,
    name NVARCHAR(100) NOT NULL CONSTRAINT UQ_view_types_name UNIQUE
);

CREATE TABLE dbo.bed_types (
    id   VARCHAR(50)   NOT NULL CONSTRAINT PK_bed_types PRIMARY KEY,
    name NVARCHAR(100) NOT NULL CONSTRAINT UQ_bed_types_name UNIQUE
);
GO

/* ============================================================
   ROOMS
   ============================================================ */
CREATE TABLE dbo.rooms (
    id           VARCHAR(50)    NOT NULL CONSTRAINT PK_rooms PRIMARY KEY,
    room_type_id VARCHAR(50)    NULL CONSTRAINT FK_rooms_room_types REFERENCES dbo.room_types(id),
    view_type_id VARCHAR(50)    NULL CONSTRAINT FK_rooms_view_types REFERENCES dbo.view_types(id),
    bed_type_id  VARCHAR(50)    NULL CONSTRAINT FK_rooms_bed_types  REFERENCES dbo.bed_types(id),
    floor        INT            NOT NULL,
    name         NVARCHAR(200)  NOT NULL,
    rating       DECIMAL(3,1)   NOT NULL CONSTRAINT DF_rooms_rating DEFAULT 0,
    review_count INT            NOT NULL CONSTRAINT DF_rooms_review_count DEFAULT 0,
    size         DECIMAL(10,2)  NULL,
    max_guests   INT            NOT NULL CONSTRAINT CK_rooms_max_guests CHECK (max_guests > 0),
    bed_count    INT            NOT NULL CONSTRAINT DF_rooms_bed_count DEFAULT 1,
    description  NVARCHAR(MAX)  NULL,
    price        DECIMAL(15,2)  NOT NULL CONSTRAINT CK_rooms_price CHECK (price >= 0),
    is_active    BIT            NOT NULL CONSTRAINT DF_rooms_is_active DEFAULT 1,
    updated_at   DATETIME2(0)   NOT NULL CONSTRAINT DF_rooms_updated_at DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.room_images (
    id         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_room_images PRIMARY KEY,
    room_id    VARCHAR(50)       NOT NULL CONSTRAINT FK_room_images_rooms REFERENCES dbo.rooms(id) ON DELETE CASCADE,
    image_url  NVARCHAR(500)     NOT NULL,
    is_primary BIT               NOT NULL CONSTRAINT DF_room_images_is_primary DEFAULT 0
);

CREATE TABLE dbo.amenities (
    id        VARCHAR(50)   NOT NULL CONSTRAINT PK_amenities PRIMARY KEY,
    name      NVARCHAR(100) NOT NULL CONSTRAINT UQ_amenities_name UNIQUE,
    icon_name VARCHAR(50)   NULL
);

CREATE TABLE dbo.room_amenities (
    room_id    VARCHAR(50) NOT NULL CONSTRAINT FK_room_amenities_rooms     REFERENCES dbo.rooms(id)     ON DELETE CASCADE,
    amenity_id VARCHAR(50) NOT NULL CONSTRAINT FK_room_amenities_amenities REFERENCES dbo.amenities(id) ON DELETE CASCADE,
    CONSTRAINT PK_room_amenities PRIMARY KEY (room_id, amenity_id)
);
GO

/* ============================================================
   BOOKINGS
   - id is an ever-increasing BIGINT IDENTITY: a narrow clustered key
     means inserts always append at the end of the B-tree (no page splits).
   - booking_code is derived from id (computed + PERSISTED) so it is always
     unique and never has to be generated in application code.
   - nights is computed so price = nights * room price is never out of sync.
   ============================================================ */
CREATE TABLE dbo.bookings (
    id               BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_bookings PRIMARY KEY,
    booking_code     AS ('OH' + RIGHT('000000' + CAST(id AS VARCHAR(20)), 6)) PERSISTED,
    user_id          UNIQUEIDENTIFIER NOT NULL,            -- Supabase auth.users.id
    user_email       NVARCHAR(255)    NULL,                -- account email snapshot
    room_id          VARCHAR(50)      NOT NULL CONSTRAINT FK_bookings_rooms REFERENCES dbo.rooms(id),
    check_in         DATE             NOT NULL,
    check_out        DATE             NOT NULL,
    nights           AS (DATEDIFF(DAY, check_in, check_out)) PERSISTED,
    guest_count      INT              NOT NULL CONSTRAINT CK_bookings_guest_count CHECK (guest_count > 0),
    guest_name       NVARCHAR(200)    NOT NULL,
    guest_email      NVARCHAR(255)    NOT NULL,
    guest_phone      VARCHAR(20)      NOT NULL,
    special_requests NVARCHAR(1000)   NULL,
    total_price      DECIMAL(15,2)    NOT NULL,
    status           VARCHAR(20)      NOT NULL CONSTRAINT DF_bookings_status DEFAULT 'Pending',
    created_at       DATETIME2(0)     NOT NULL CONSTRAINT DF_bookings_created_at DEFAULT SYSUTCDATETIME(),
    updated_at       DATETIME2(0)     NOT NULL CONSTRAINT DF_bookings_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_bookings_dates  CHECK (check_out > check_in),
    CONSTRAINT CK_bookings_status CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled'))
);
GO

/* ============================================================
   PAYMENTS (1 booking : 1 payment)
   The hotel only accepts payment at the hotel (cod): the payment row is
   created with the booking as Pending, becomes Completed when the stay is
   completed (cash collected), and Cancelled when the booking is cancelled.
   ============================================================ */
CREATE TABLE dbo.payments (
    id             BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_payments PRIMARY KEY,
    booking_id     BIGINT        NOT NULL CONSTRAINT FK_payments_bookings REFERENCES dbo.bookings(id) ON DELETE CASCADE,
    payment_method VARCHAR(20)   NOT NULL CONSTRAINT DF_payments_method DEFAULT 'cod'
                                 CONSTRAINT CK_payments_method CHECK (payment_method = 'cod'),  -- cod = pay at hotel
    amount         DECIMAL(15,2) NOT NULL,
    status         VARCHAR(20)   NOT NULL CONSTRAINT DF_payments_status DEFAULT 'Pending',
    paid_at        DATETIME2(0)  NULL,
    CONSTRAINT UQ_payments_booking_id UNIQUE (booking_id),
    CONSTRAINT CK_payments_status CHECK (status IN ('Pending', 'Completed', 'Cancelled'))
);
GO

/* ============================================================
   BOOKING HISTORY (audit log, written only by trg_bookings_audit)
   No FK to bookings on purpose: an audit row must survive the
   deletion of the booking it describes.
   ============================================================ */
CREATE TABLE dbo.history_booking (
    id           BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_history_booking PRIMARY KEY,
    booking_id   BIGINT        NOT NULL,
    booking_code VARCHAR(20)   NULL,
    action       VARCHAR(30)   NOT NULL,     -- CREATED | STATUS_CHANGE | DELETED
    old_status   VARCHAR(20)   NULL,
    new_status   VARCHAR(20)   NULL,
    note         NVARCHAR(500) NULL,
    created_at   DATETIME2(0)  NOT NULL CONSTRAINT DF_history_booking_created_at DEFAULT SYSUTCDATETIME()
);
GO

/* ============================================================
   ROOM EMBEDDINGS (AI semantic search, see 05_semantic_search.sql)
   One 1024-dimension vector per room, produced by the bge-m3 model.
   Rows are deleted by triggers whenever the room text changes, and
   the app re-embeds missing rooms before the next search.
   ============================================================ */
CREATE TABLE dbo.room_embeddings (
    room_id    VARCHAR(50)  NOT NULL CONSTRAINT PK_room_embeddings PRIMARY KEY
                            CONSTRAINT FK_room_embeddings_rooms REFERENCES dbo.rooms(id) ON DELETE CASCADE,
    embedding  VECTOR(1024) NOT NULL,
    model      VARCHAR(100) NOT NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_room_embeddings_created_at DEFAULT SYSUTCDATETIME()
);
GO
