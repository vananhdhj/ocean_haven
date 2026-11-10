/* ============================================================
   Ocean Haven Hotel — Triggers
   SQL Server triggers are statement-level: they fire once per
   INSERT/UPDATE/DELETE statement, and the virtual tables `inserted`
   and `deleted` hold ALL affected rows. Every trigger below is written
   set-based so multi-row statements are handled correctly.

     inserted  = new row versions   (INSERT, UPDATE)
     deleted   = old row versions   (UPDATE, DELETE)
   ============================================================ */
USE OceanHaven;
GO

/* ------------------------------------------------------------
   1. trg_bookings_audit  (AFTER INSERT, UPDATE, DELETE)
   Writes an audit row to history_booking for every booking that is
   created, changes status, or is deleted, whoever made the change
   (stored procedure, admin, or a manual query in SSMS).
   ------------------------------------------------------------ */
CREATE OR ALTER TRIGGER dbo.trg_bookings_audit
ON dbo.bookings
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- INSERT: rows in inserted with no matching old version
    INSERT INTO dbo.history_booking (booking_id, booking_code, action, old_status, new_status, note)
    SELECT i.id, i.booking_code, 'CREATED', NULL, i.status,
           CONCAT(N'Room ', i.room_id, N', ', i.check_in, N' to ', i.check_out,
                  N', ', i.nights, N' night(s), total ', FORMAT(i.total_price, 'N0'), N' VND')
    FROM inserted AS i
    WHERE NOT EXISTS (SELECT 1 FROM deleted AS d WHERE d.id = i.id);

    -- UPDATE: only when the status actually changed
    INSERT INTO dbo.history_booking (booking_id, booking_code, action, old_status, new_status, note)
    SELECT i.id, i.booking_code, 'STATUS_CHANGE', d.status, i.status,
           CONCAT(N'Status changed from ', d.status, N' to ', i.status)
    FROM inserted AS i
    JOIN deleted  AS d ON d.id = i.id
    WHERE i.status <> d.status;

    -- DELETE: rows in deleted with no new version
    INSERT INTO dbo.history_booking (booking_id, booking_code, action, old_status, new_status, note)
    SELECT d.id, d.booking_code, 'DELETED', d.status, NULL, N'Booking deleted'
    FROM deleted AS d
    WHERE NOT EXISTS (SELECT 1 FROM inserted AS i WHERE i.id = d.id);
END;
GO

/* ------------------------------------------------------------
   2. trg_bookings_prevent_overlap  (AFTER INSERT, UPDATE)
   Last line of defence against double-booking. sp_CreateBooking already
   checks availability, but this trigger also catches writes that do not go
   through it, e.g. an admin re-confirming a booking whose dates were taken
   meanwhile, or a manual INSERT. THROW inside a trigger rolls back the whole
   statement, so the conflicting row is never stored.
   ------------------------------------------------------------ */
CREATE OR ALTER TRIGGER dbo.trg_bookings_prevent_overlap
ON dbo.bookings
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Only these columns can create a new overlap.
    IF NOT (UPDATE(status) OR UPDATE(room_id) OR UPDATE(check_in)
            OR UPDATE(check_out))
        RETURN;

    IF EXISTS (
        SELECT 1
        FROM inserted AS i
        CROSS APPLY dbo.fn_BlockingBookings(i.check_in, i.check_out) AS other
        WHERE other.room_id = i.room_id
          AND other.id <> i.id
          -- the new/changed row itself must be one that blocks the room
          AND i.status IN ('Pending', 'Confirmed')
    )
        THROW 50010, N'Room is not available for selected dates.', 1;
END;
GO

/* ------------------------------------------------------------
   3. trg_rooms_invalidate_embedding  (AFTER UPDATE on rooms)
   The AI search vector of a room is built from its name, type, view,
   beds, capacity and description. When any of those change, the stored
   vector is stale, so the trigger deletes it; the app re-embeds every
   room without a vector before the next semantic search.
   ------------------------------------------------------------ */
CREATE OR ALTER TRIGGER dbo.trg_rooms_invalidate_embedding
ON dbo.rooms
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(name) OR UPDATE(description) OR UPDATE(room_type_id) OR UPDATE(view_type_id)
       OR UPDATE(bed_type_id) OR UPDATE(bed_count) OR UPDATE(max_guests) OR UPDATE(floor)
    BEGIN
        DELETE e
        FROM dbo.room_embeddings AS e
        JOIN inserted AS i ON i.id = e.room_id;

        UPDATE r
        SET updated_at = SYSUTCDATETIME()
        FROM dbo.rooms AS r
        JOIN inserted AS i ON i.id = r.id;
    END;
END;
GO

/* ------------------------------------------------------------
   4. trg_room_amenities_invalidate_embedding  (AFTER INSERT, DELETE)
   Amenities are part of the embedded text too ("Jacuzzi", "Kitchenette"...),
   so adding or removing one also invalidates the room's vector.
   ------------------------------------------------------------ */
CREATE OR ALTER TRIGGER dbo.trg_room_amenities_invalidate_embedding
ON dbo.room_amenities
AFTER INSERT, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DELETE e
    FROM dbo.room_embeddings AS e
    WHERE e.room_id IN (SELECT room_id FROM inserted
                        UNION
                        SELECT room_id FROM deleted);
END;
GO
