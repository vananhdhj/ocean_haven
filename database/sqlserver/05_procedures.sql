/* ============================================================
   Ocean Haven Hotel — Stored procedures

   WRITE procedures (business logic, each one a single transaction):
     sp_CreateBooking          validate -> lock room -> check availability -> insert booking + payment
     sp_UpdateBookingStatus    admin status change with allowed transitions -> keeps payment in sync
     sp_CancelMyBooking        guest cancels own booking before check-in -> booking + payment cancelled

   READ procedures (called by the Next.js app):
     sp_GetRooms, sp_GetUserBookings, sp_GetAdminBookings, sp_GetAdminStats

   Transaction pattern used by every write procedure:
     SET XACT_ABORT ON      -> any runtime error dooms the transaction (no half-written data)
     BEGIN TRY / BEGIN TRANSACTION ... COMMIT
     BEGIN CATCH: IF @@TRANCOUNT > 0 ROLLBACK; THROW  -> undo, then re-raise to the app
   Business errors are raised with THROW 500xx; the app shows their message to the user.
   ============================================================ */
USE OceanHaven;
GO

/* ------------------------------------------------------------
   sp_CreateBooking
   Called by: createBooking server action (booking form)
   ------------------------------------------------------------ */
CREATE OR ALTER PROCEDURE dbo.sp_CreateBooking
    @UserId          UNIQUEIDENTIFIER,
    @UserEmail       NVARCHAR(255),
    @RoomId          VARCHAR(50),
    @CheckIn         DATE,
    @CheckOut        DATE,
    @GuestCount      INT,
    @GuestName       NVARCHAR(200),
    @GuestEmail      NVARCHAR(255),
    @GuestPhone      VARCHAR(20),
    @SpecialRequests NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Price DECIMAL(15,2), @MaxGuests INT, @BookingId BIGINT, @Message NVARCHAR(200);

    -- 1. Input checks that need no data (done before opening a transaction)
    IF @CheckOut <= @CheckIn
        THROW 50001, N'Check-out date must be after check-in date.', 1;
    IF @CheckIn < CAST(SYSUTCDATETIME() AS DATE)
        THROW 50002, N'Check-in date cannot be in the past.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 2. Lock the room row. UPDLOCK makes a second booking of the SAME room
        --    wait here until this transaction commits, so two guests can never
        --    both pass the availability check below (race condition).
        --    ROWLOCK keeps bookings of other rooms running in parallel.
        SELECT @Price = price, @MaxGuests = max_guests
        FROM dbo.rooms WITH (UPDLOCK, ROWLOCK)
        WHERE id = @RoomId AND is_active = 1;

        IF @Price IS NULL
            THROW 50004, N'Room not found.', 1;

        IF @GuestCount > @MaxGuests
        BEGIN
            SET @Message = CONCAT(N'This room allows at most ', @MaxGuests, N' guests.');
            THROW 50005, @Message, 1;
        END;

        -- 3. Availability (same rule as the overlap trigger)
        IF EXISTS (SELECT 1
                   FROM dbo.fn_BlockingBookings(@CheckIn, @CheckOut)
                   WHERE room_id = @RoomId)
            THROW 50010, N'Room is not available for selected dates.', 1;

        -- 4. Booking: price is computed here from the database, never trusted from the client
        INSERT INTO dbo.bookings
            (user_id, user_email, room_id, check_in, check_out, guest_count,
             guest_name, guest_email, guest_phone, special_requests,
             total_price, status)
        VALUES
            (@UserId, @UserEmail, @RoomId, @CheckIn, @CheckOut, @GuestCount,
             @GuestName, @GuestEmail, @GuestPhone, NULLIF(@SpecialRequests, N''),
             @Price * DATEDIFF(DAY, @CheckIn, @CheckOut),
             'Pending');

        SET @BookingId = SCOPE_IDENTITY();

        -- 5. Payment row in the same transaction: a booking never exists without one.
        --    The guest pays at the hotel, so it stays Pending until the stay is completed.
        INSERT INTO dbo.payments (booking_id, payment_method, amount, status)
        SELECT id, 'cod', total_price, 'Pending'
        FROM dbo.bookings
        WHERE id = @BookingId;

        COMMIT TRANSACTION;

        SELECT b.id, b.booking_code, b.total_price, b.nights
        FROM dbo.bookings AS b
        WHERE b.id = @BookingId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

/* ------------------------------------------------------------
   sp_UpdateBookingStatus
   Called by: admin dashboard (updateBookingStatusAction)

   Allowed transitions:
     Pending   -> Confirmed | Completed | Cancelled
     Confirmed -> Completed | Cancelled
     Completed, Cancelled are final.
   Payment side effects (same transaction):
     -> Cancelled : the pending pay-at-hotel payment is Cancelled
     -> Completed : the guest paid at the hotel, so the payment is Completed (cash collected)
   The history row is written by trg_bookings_audit.
   ------------------------------------------------------------ */
CREATE OR ALTER PROCEDURE dbo.sp_UpdateBookingStatus
    @BookingId BIGINT,
    @NewStatus VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @OldStatus VARCHAR(20), @Message NVARCHAR(200);

    IF @NewStatus NOT IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')
        THROW 50020, N'Invalid booking status.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @OldStatus = status
        FROM dbo.bookings WITH (UPDLOCK, ROWLOCK)
        WHERE id = @BookingId;

        IF @OldStatus IS NULL
            THROW 50021, N'Booking not found.', 1;

        IF NOT (   (@OldStatus = 'Pending'   AND @NewStatus IN ('Confirmed', 'Completed', 'Cancelled'))
                OR (@OldStatus = 'Confirmed' AND @NewStatus IN ('Completed', 'Cancelled')))
        BEGIN
            SET @Message = CONCAT(N'Cannot change booking status from ', @OldStatus, N' to ', @NewStatus, N'.');
            THROW 50022, @Message, 1;
        END;

        UPDATE dbo.bookings
        SET status = @NewStatus,
            updated_at = SYSUTCDATETIME()
        WHERE id = @BookingId;

        IF @NewStatus = 'Cancelled'
            UPDATE dbo.payments
            SET status = 'Cancelled'
            WHERE booking_id = @BookingId AND status = 'Pending';

        IF @NewStatus = 'Completed'
            UPDATE dbo.payments
            SET status = 'Completed', paid_at = SYSUTCDATETIME()
            WHERE booking_id = @BookingId AND status = 'Pending';

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

/* ------------------------------------------------------------
   sp_CancelMyBooking
   Called by: cancelMyBooking server action (guest's profile page)

   A guest cancels their OWN booking, before the check-in date:
     - another user's booking is reported as "not found" (50030), so the
       procedure never reveals which booking ids exist
     - only Pending or Confirmed bookings can be cancelled (50031)
     - from the check-in date on, only the hotel can change it (50032)
   Booking and its pay-at-hotel payment are cancelled in ONE transaction,
   so a cancelled booking can never keep a payment that is still due.
   The history row is written by trg_bookings_audit.
   ------------------------------------------------------------ */
CREATE OR ALTER PROCEDURE dbo.sp_CancelMyBooking
    @BookingId BIGINT,
    @UserId    UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Status VARCHAR(20), @CheckIn DATE, @BookingCode VARCHAR(20);

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Lock the booking so an admin status change cannot run at the same time
        SELECT @Status = status, @CheckIn = check_in, @BookingCode = booking_code
        FROM dbo.bookings WITH (UPDLOCK, ROWLOCK)
        WHERE id = @BookingId AND user_id = @UserId;

        IF @Status IS NULL
            THROW 50030, N'Booking not found.', 1;

        IF @Status NOT IN ('Pending', 'Confirmed')
            THROW 50031, N'This booking can no longer be cancelled.', 1;

        IF @CheckIn <= CAST(SYSUTCDATETIME() AS DATE)
            THROW 50032, N'Bookings can only be cancelled before the check-in date. Please contact the hotel.', 1;

        UPDATE dbo.bookings
        SET status = 'Cancelled', updated_at = SYSUTCDATETIME()
        WHERE id = @BookingId;

        UPDATE dbo.payments
        SET status = 'Cancelled'
        WHERE booking_id = @BookingId AND status = 'Pending';

        COMMIT TRANSACTION;

        SELECT @BookingCode AS booking_code;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

/* ============================================================
   READ PROCEDURES
   ============================================================ */

/* ------------------------------------------------------------
   sp_GetRooms: active rooms with their images and amenities as ONE JSON
   document (nested FOR JSON), so the app gets everything in one round trip.
   Optional filters: a single room, and/or availability for a date range.
   OPTION (RECOMPILE): the "@x IS NULL OR col = @x" pattern otherwise gets
   one cached plan for all filter combinations; recompiling lets SQL Server
   build the best plan (index seek) for the filters actually supplied.
   ------------------------------------------------------------ */
CREATE OR ALTER PROCEDURE dbo.sp_GetRooms
    @RoomId   VARCHAR(50) = NULL,
    @CheckIn  DATE        = NULL,
    @CheckOut DATE        = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT (
        SELECT r.id, r.name, r.floor, r.rating, r.review_count, r.size,
               r.max_guests, r.bed_count, r.description, r.price,
               rt.name AS room_type,
               vt.name AS view_type,
               bt.name AS bed_type,
               (SELECT i.image_url, i.is_primary
                FROM dbo.room_images AS i
                WHERE i.room_id = r.id
                ORDER BY i.is_primary DESC, i.id
                FOR JSON PATH) AS images,
               (SELECT a.name
                FROM dbo.room_amenities AS ra
                JOIN dbo.amenities AS a ON a.id = ra.amenity_id
                WHERE ra.room_id = r.id
                ORDER BY a.name
                FOR JSON PATH) AS amenities
        FROM dbo.rooms AS r
        LEFT JOIN dbo.room_types AS rt ON rt.id = r.room_type_id
        LEFT JOIN dbo.view_types AS vt ON vt.id = r.view_type_id
        LEFT JOIN dbo.bed_types  AS bt ON bt.id = r.bed_type_id
        WHERE r.is_active = 1
          AND (@RoomId IS NULL OR r.id = @RoomId)
          AND (@CheckIn IS NULL OR @CheckOut IS NULL
               OR NOT EXISTS (SELECT 1
                              FROM dbo.fn_BlockingBookings(@CheckIn, @CheckOut) AS bb
                              WHERE bb.room_id = r.id))
        ORDER BY r.floor, r.name
        FOR JSON PATH
    ) AS rooms_json
    OPTION (RECOMPILE);
END;
GO

/* ------------------------------------------------------------
   sp_GetUserBookings: profile page. Seeks IX_bookings_user_created.
   ------------------------------------------------------------ */
CREATE OR ALTER PROCEDURE dbo.sp_GetUserBookings
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT b.id, b.booking_code, r.name AS room_name,
           CONVERT(CHAR(10), b.check_in, 23)  AS check_in,     -- yyyy-mm-dd
           CONVERT(CHAR(10), b.check_out, 23) AS check_out,
           b.guest_count, b.status, p.status AS payment_status,
           CONVERT(VARCHAR(19), b.created_at, 126) + 'Z' AS created_at,  -- ISO 8601 UTC
           b.total_price
    FROM dbo.bookings AS b
    JOIN dbo.rooms AS r ON r.id = b.room_id
    LEFT JOIN dbo.payments AS p ON p.booking_id = b.id
    WHERE b.user_id = @UserId
    ORDER BY b.created_at DESC;
END;
GO

/* ------------------------------------------------------------
   sp_GetAdminBookings: admin table with optional phone prefix search.
   The prefix LIKE seeks IX_bookings_guest_phone (see 02_indexes.sql).
   ------------------------------------------------------------ */
CREATE OR ALTER PROCEDURE dbo.sp_GetAdminBookings
    @PhoneSearch VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @PhoneSearch = NULLIF(LTRIM(RTRIM(@PhoneSearch)), '');

    SELECT b.id, b.booking_code, b.guest_name, b.guest_phone,
           CONVERT(CHAR(10), b.check_in, 23)  AS check_in,
           CONVERT(CHAR(10), b.check_out, 23) AS check_out,
           b.total_price, b.status,
           CONVERT(VARCHAR(19), b.created_at, 126) + 'Z' AS created_at,
           r.name AS room_name,
           b.user_email, p.status AS payment_status
    FROM dbo.bookings AS b
    JOIN dbo.rooms AS r ON r.id = b.room_id
    LEFT JOIN dbo.payments AS p ON p.booking_id = b.id
    WHERE @PhoneSearch IS NULL OR b.guest_phone LIKE @PhoneSearch + '%'
    ORDER BY b.check_in DESC
    OPTION (RECOMPILE);
END;
GO

/* ------------------------------------------------------------
   sp_GetAdminStats: dashboard counters in a single pass over bookings
   (conditional aggregation) instead of four separate COUNT queries.
   Revenue is read from the covering index IX_payments_status.
   ------------------------------------------------------------ */
CREATE OR ALTER PROCEDURE dbo.sp_GetAdminStats
AS
BEGIN
    SET NOCOUNT ON;

    SELECT bs.total_bookings, bs.confirmed, bs.pending, bs.cancelled,
           (SELECT COALESCE(SUM(amount), 0) FROM dbo.payments WHERE status = 'Completed') AS total_revenue,
           (SELECT COUNT(*) FROM dbo.rooms WHERE is_active = 1) AS total_rooms
    FROM (
        SELECT COUNT(*) AS total_bookings,
               COALESCE(SUM(CASE WHEN status IN ('Confirmed', 'Completed') THEN 1 ELSE 0 END), 0) AS confirmed,
               COALESCE(SUM(CASE WHEN status = 'Pending'   THEN 1 ELSE 0 END), 0) AS pending,
               COALESCE(SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END), 0) AS cancelled
        FROM dbo.bookings
    ) AS bs;
END;
GO
