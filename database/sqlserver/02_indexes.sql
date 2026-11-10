/* ============================================================
   Ocean Haven Hotel — Indexes
   Every PRIMARY KEY above is already a CLUSTERED index and every UNIQUE
   constraint is a unique nonclustered index. This file adds the
   NONCLUSTERED indexes that the application's real queries need.

   Each index lists:  the query it serves  ->  why the index helps.
   A measured before/after comparison is in tests/index_demo.sql and README.md.
   ============================================================ */
USE OceanHaven;
GO

/* ------------------------------------------------------------
   1. Availability / overlap check (the hottest query in the system)
      Used by: fn_BlockingBookings -> sp_CreateBooking, sp_GetRooms,
               sp_SemanticSearchRooms, trg_bookings_prevent_overlap
      Predicate: room_id = @r AND check_in < @out AND check_out > @in
                 AND status IN ('Pending','Confirmed')

   - Key (room_id, check_in): SEEK straight to one room, then a range scan
     over check_in < @out, instead of reading the whole bookings table.
   - INCLUDE (check_out): the remaining predicate is
     answered from the index leaf, so no key lookup into the clustered index.
   - FILTERED on active statuses: Cancelled/Completed rows (most of the
     table over time) are never in the index, so it stays small and cheap
     to maintain. The predicate in fn_BlockingBookings matches the filter
     literally, which is what lets the optimizer choose it.
   ------------------------------------------------------------ */
CREATE NONCLUSTERED INDEX IX_bookings_active_room_dates
    ON dbo.bookings (room_id, check_in)
    INCLUDE (check_out)
    WHERE status IN ('Pending', 'Confirmed');
GO

/* ------------------------------------------------------------
   2. Booking codes are unique and can be looked up
      Used by: lookups by the code a guest quotes (WHERE booking_code = @code)
   - UNIQUE guarantees one booking per code AND gives a single-row seek.
   - Possible because booking_code is a PERSISTED computed column.
   ------------------------------------------------------------ */
CREATE UNIQUE NONCLUSTERED INDEX UX_bookings_booking_code
    ON dbo.bookings (booking_code);
GO

/* ------------------------------------------------------------
   3. "My bookings" on the profile page
      Used by: sp_GetUserBookings (WHERE user_id = @u ORDER BY created_at DESC)
   - Equality column first, sort column second: rows come out of the
     index already in the requested order, so there is no SORT operator.
   ------------------------------------------------------------ */
CREATE NONCLUSTERED INDEX IX_bookings_user_created
    ON dbo.bookings (user_id, created_at DESC);
GO

/* ------------------------------------------------------------
   4. Admin search by guest phone
      Used by: sp_GetAdminBookings (WHERE guest_phone LIKE @phone + '%')
   - A prefix LIKE is SARGable: it becomes a range seek on this index.
     ('%0901%' with a leading wildcard could NOT seek; it must scan.)
   ------------------------------------------------------------ */
CREATE NONCLUSTERED INDEX IX_bookings_guest_phone
    ON dbo.bookings (guest_phone);
GO

/* ------------------------------------------------------------
   5. Revenue on the admin dashboard
      Used by: sp_GetAdminStats (SUM(amount) WHERE status = 'Completed')
   - COVERING index: status is the seek key and amount is INCLUDEd, so the
     SUM is computed from this narrow index alone.
   ------------------------------------------------------------ */
CREATE NONCLUSTERED INDEX IX_payments_status
    ON dbo.payments (status)
    INCLUDE (amount);
GO

/* ------------------------------------------------------------
   6. Foreign-key support indexes
   SQL Server does NOT index foreign keys automatically. Without these,
   every join from rooms to its children and every ON DELETE CASCADE
   would scan the child table.
   ------------------------------------------------------------ */
CREATE NONCLUSTERED INDEX IX_room_images_room
    ON dbo.room_images (room_id) INCLUDE (image_url, is_primary);

-- PK_room_amenities (room_id, amenity_id) already serves room -> amenities;
-- this one serves the reverse direction and cascades from amenities.
CREATE NONCLUSTERED INDEX IX_room_amenities_amenity
    ON dbo.room_amenities (amenity_id);

-- Booking timeline on the admin side: WHERE booking_id = @id ORDER BY created_at
CREATE NONCLUSTERED INDEX IX_history_booking_booking
    ON dbo.history_booking (booking_id, created_at);
GO
