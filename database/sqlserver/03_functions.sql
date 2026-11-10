/* ============================================================
   Ocean Haven Hotel — Functions
   ============================================================ */
USE OceanHaven;
GO

/* ------------------------------------------------------------
   fn_BlockingBookings: the ONE definition of "this booking occupies the room".
   Used by sp_CreateBooking, sp_GetRooms, sp_SemanticSearchRooms and
   trg_bookings_prevent_overlap, so the rule can never drift between them.

   A booking blocks a room for [@CheckIn, @CheckOut) when:
     - it is Pending or Confirmed (Cancelled/Completed free the room), and
     - its date range overlaps:  check_in < @CheckOut AND check_out > @CheckIn
       (check-out day is free for the next guest).

   Inline table-valued function: the optimizer expands it into the calling
   query, so it can seek on IX_bookings_active_room_dates.
   ------------------------------------------------------------ */
CREATE OR ALTER FUNCTION dbo.fn_BlockingBookings (@CheckIn DATE, @CheckOut DATE)
RETURNS TABLE
AS
RETURN
    SELECT b.id, b.room_id
    FROM dbo.bookings AS b
    WHERE b.status IN ('Pending', 'Confirmed')
      AND b.check_in  < @CheckOut
      AND b.check_out > @CheckIn;
GO
