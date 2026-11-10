/* ============================================================
   Ocean Haven Hotel — tests for stored procedures and triggers
   Run with: npm run db:test   (or execute in SSMS after 01..07)

   Uses a dedicated test user and dates in 2031, and deletes its own data
   at the start and the end, so it can be re-run safely.
   Each check prints PASS or stops the script with FAIL.
   ============================================================ */
USE OceanHaven;
GO

CREATE OR ALTER PROCEDURE #Assert @Condition BIT, @Name NVARCHAR(200)
AS
BEGIN
    IF @Condition = 1
        PRINT CONCAT(N'PASS  ', @Name);
    ELSE
    BEGIN
        DECLARE @Msg NVARCHAR(300) = CONCAT(N'FAIL  ', @Name);
        THROW 50999, @Msg, 1;
    END;
END;
GO

CREATE OR ALTER PROCEDURE #Cleanup
AS
BEGIN
    DECLARE @Ids TABLE (id BIGINT);
    INSERT INTO @Ids SELECT id FROM dbo.bookings WHERE user_id = '11111111-1111-1111-1111-111111111111';
    DELETE FROM dbo.bookings WHERE id IN (SELECT id FROM @Ids);          -- payments cascade
    DELETE FROM dbo.history_booking WHERE booking_id IN (SELECT id FROM @Ids);
END;
GO

EXEC #Cleanup;
GO

SET NOCOUNT ON;

DECLARE @User UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111111111';
DECLARE @A BIGINT, @B BIGINT, @C BIGINT, @CodeA VARCHAR(20), @Err INT, @Ok BIT;
DECLARE @Result TABLE (id BIGINT, booking_code VARCHAR(20), total_price DECIMAL(15,2), nights INT);

PRINT N'--- sp_CreateBooking ---';

-- 1. Happy path: 3 nights in room-001 (2,250,000 VND/night), paid at the hotel
INSERT INTO @Result
EXEC dbo.sp_CreateBooking @UserId = @User, @UserEmail = N'test@oceanhaven.vn', @RoomId = 'room-001',
     @CheckIn = '2031-01-10', @CheckOut = '2031-01-13', @GuestCount = 2,
     @GuestName = N'Test Guest', @GuestEmail = N'test@oceanhaven.vn', @GuestPhone = '0900000001';
SELECT @A = id, @CodeA = booking_code FROM @Result;

SET @Ok = IIF((SELECT total_price FROM dbo.bookings WHERE id = @A) = 6750000, 1, 0);
EXEC #Assert @Ok, N'total price = 3 nights x room price (computed in the database)';
SET @Ok = IIF(EXISTS (SELECT 1 FROM dbo.payments WHERE booking_id = @A AND payment_method = 'cod'
                                                   AND status = 'Pending' AND amount = 6750000), 1, 0);
EXEC #Assert @Ok, N'pay-at-hotel payment row created in the same transaction';
SET @Ok = IIF(@CodeA LIKE 'OH[0-9][0-9][0-9][0-9][0-9][0-9]', 1, 0);
EXEC #Assert @Ok, N'booking_code generated from identity (OH + 6 digits)';
SET @Ok = IIF(EXISTS (SELECT 1 FROM dbo.history_booking WHERE booking_id = @A AND action = 'CREATED'), 1, 0);
EXEC #Assert @Ok, N'trg_bookings_audit logged CREATED';

-- 2. Overlapping dates are rejected and nothing is left behind
DECLARE @BookingsBefore INT = (SELECT COUNT(*) FROM dbo.bookings), @PaymentsBefore INT = (SELECT COUNT(*) FROM dbo.payments);
SET @Err = 0;
BEGIN TRY
    EXEC dbo.sp_CreateBooking @UserId = @User, @UserEmail = NULL, @RoomId = 'room-001',
         @CheckIn = '2031-01-12', @CheckOut = '2031-01-14', @GuestCount = 1,
         @GuestName = N'Second Guest', @GuestEmail = N'x@x.vn', @GuestPhone = '0900000002';
END TRY
BEGIN CATCH
    SET @Err = ERROR_NUMBER();
    IF @@TRANCOUNT > 0 ROLLBACK;
END CATCH;
SET @Ok = IIF(@Err = 50010, 1, 0);
EXEC #Assert @Ok, N'overlapping booking rejected with error 50010';
SET @Ok = IIF((SELECT COUNT(*) FROM dbo.bookings) = @BookingsBefore AND (SELECT COUNT(*) FROM dbo.payments) = @PaymentsBefore, 1, 0);
EXEC #Assert @Ok, N'rejected booking rolled back completely (no orphan rows)';

-- 3. Check-out day can be the next guest's check-in day
DELETE FROM @Result;
INSERT INTO @Result
EXEC dbo.sp_CreateBooking @UserId = @User, @UserEmail = NULL, @RoomId = 'room-001',
     @CheckIn = '2031-01-13', @CheckOut = '2031-01-15', @GuestCount = 2,
     @GuestName = N'Back To Back', @GuestEmail = N'b@b.vn', @GuestPhone = '0900000003';
SELECT @B = id FROM @Result;
SET @Ok = IIF(@B IS NOT NULL, 1, 0);
EXEC #Assert @Ok, N'back-to-back booking allowed (check-out day is free)';

-- 4. Validation errors
SET @Err = 0;
BEGIN TRY
    EXEC dbo.sp_CreateBooking @UserId = @User, @UserEmail = NULL, @RoomId = 'room-001',
         @CheckIn = '2031-02-01', @CheckOut = '2031-02-03', @GuestCount = 5,
         @GuestName = N'Too Many', @GuestEmail = N'm@m.vn', @GuestPhone = '0900000004';
END TRY
BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH;
SET @Ok = IIF(@Err = 50005, 1, 0);
EXEC #Assert @Ok, N'too many guests rejected (50005)';

SET @Err = 0;
BEGIN TRY
    EXEC dbo.sp_CreateBooking @UserId = @User, @UserEmail = NULL, @RoomId = 'room-001',
         @CheckIn = '2031-02-05', @CheckOut = '2031-02-05', @GuestCount = 1,
         @GuestName = N'Zero Nights', @GuestEmail = N'z@z.vn', @GuestPhone = '0900000005';
END TRY
BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH;
SET @Ok = IIF(@Err = 50001, 1, 0);
EXEC #Assert @Ok, N'check-out not after check-in rejected (50001)';

PRINT N'--- sp_UpdateBookingStatus ---';

EXEC dbo.sp_UpdateBookingStatus @BookingId = @A, @NewStatus = 'Confirmed';
SET @Ok = IIF((SELECT status FROM dbo.bookings WHERE id = @A) = 'Confirmed'
              AND (SELECT status FROM dbo.payments WHERE booking_id = @A) = 'Pending', 1, 0);
EXEC #Assert @Ok, N'admin confirms the booking; cash is still to be paid at the hotel';
SET @Ok = IIF(EXISTS (SELECT 1 FROM dbo.history_booking
                      WHERE booking_id = @A AND action = 'STATUS_CHANGE'
                        AND old_status = 'Pending' AND new_status = 'Confirmed'), 1, 0);
EXEC #Assert @Ok, N'trg_bookings_audit logged Pending -> Confirmed';

SET @Err = 0;
BEGIN TRY EXEC dbo.sp_UpdateBookingStatus @BookingId = @A, @NewStatus = 'Pending'; END TRY
BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH;
SET @Ok = IIF(@Err = 50022, 1, 0);
EXEC #Assert @Ok, N'Confirmed -> Pending is not an allowed transition (50022)';

PRINT N'--- trg_bookings_prevent_overlap ---';

SET @Err = 0;
BEGIN TRY
    INSERT INTO dbo.bookings (user_id, room_id, check_in, check_out, guest_count,
                              guest_name, guest_email, guest_phone, total_price, status)
    VALUES (@User, 'room-001', '2031-01-11', '2031-01-12', 1, N'Direct Insert', N'd@d.vn', '0900000006', 1, 'Confirmed');
END TRY
BEGIN CATCH
    SET @Err = ERROR_NUMBER();
    IF @@TRANCOUNT > 0 ROLLBACK;
END CATCH;
SET @Ok = IIF(@Err = 50010, 1, 0);
EXEC #Assert @Ok, N'direct INSERT bypassing the procedure is still blocked by the trigger';

PRINT N'--- cancel and complete ---';

EXEC dbo.sp_UpdateBookingStatus @BookingId = @A, @NewStatus = 'Cancelled';
SET @Ok = IIF((SELECT status FROM dbo.payments WHERE booking_id = @A) = 'Cancelled', 1, 0);
EXEC #Assert @Ok, N'cancelling a booking cancels its pending payment';

SET @Err = 0;
BEGIN TRY EXEC dbo.sp_UpdateBookingStatus @BookingId = @A, @NewStatus = 'Confirmed'; END TRY
BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH;
SET @Ok = IIF(@Err = 50022, 1, 0);
EXEC #Assert @Ok, N'Cancelled -> Confirmed is not an allowed transition (50022)';

-- The freed dates can be booked again ...
DELETE FROM @Result;
INSERT INTO @Result
EXEC dbo.sp_CreateBooking @UserId = @User, @UserEmail = NULL, @RoomId = 'room-001',
     @CheckIn = '2031-01-10', @CheckOut = '2031-01-12', @GuestCount = 2,
     @GuestName = N'New Guest', @GuestEmail = N'n@n.vn', @GuestPhone = '0900000007';
SELECT @C = id FROM @Result;
SET @Ok = IIF(@C IS NOT NULL, 1, 0);
EXEC #Assert @Ok, N'dates freed by cancellation can be booked again';

-- ... and a manual UPDATE reviving the old booking is stopped by the trigger
SET @Err = 0;
BEGIN TRY
    UPDATE dbo.bookings SET status = 'Confirmed' WHERE id = @A;
END TRY
BEGIN CATCH
    SET @Err = ERROR_NUMBER();
    IF @@TRANCOUNT > 0 ROLLBACK;
END CATCH;
SET @Ok = IIF(@Err = 50010 AND (SELECT status FROM dbo.bookings WHERE id = @A) = 'Cancelled', 1, 0);
EXEC #Assert @Ok, N'direct UPDATE that would double-book is rolled back by the trigger';

EXEC dbo.sp_UpdateBookingStatus @BookingId = @B, @NewStatus = 'Completed';
SET @Ok = IIF(EXISTS (SELECT 1 FROM dbo.payments
                      WHERE booking_id = @B AND status = 'Completed' AND paid_at IS NOT NULL), 1, 0);
EXEC #Assert @Ok, N'completing a stay marks the cash payment as collected';

PRINT N'--- sp_CancelMyBooking ---';

DECLARE @D BIGINT, @E BIGINT;
DELETE FROM @Result;
INSERT INTO @Result
EXEC dbo.sp_CreateBooking @UserId = @User, @UserEmail = NULL, @RoomId = 'room-002',
     @CheckIn = '2031-03-10', @CheckOut = '2031-03-12', @GuestCount = 1,
     @GuestName = N'Changes Mind', @GuestEmail = N'c@c.vn', @GuestPhone = '0900000008';
SELECT @D = id FROM @Result;

SET @Err = 0;
BEGIN TRY EXEC dbo.sp_CancelMyBooking @BookingId = @D, @UserId = '22222222-2222-2222-2222-222222222222'; END TRY
BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH;
SET @Ok = IIF(@Err = 50030
              AND (SELECT status FROM dbo.bookings WHERE id = @D) = 'Pending'
              AND (SELECT status FROM dbo.payments WHERE booking_id = @D) = 'Pending', 1, 0);
EXEC #Assert @Ok, N'another user cannot cancel the booking (50030) and nothing changes';

EXEC dbo.sp_CancelMyBooking @BookingId = @D, @UserId = @User;
SET @Ok = IIF((SELECT status FROM dbo.bookings WHERE id = @D) = 'Cancelled'
              AND (SELECT status FROM dbo.payments WHERE booking_id = @D) = 'Cancelled', 1, 0);
EXEC #Assert @Ok, N'guest cancels own booking: booking and payment cancelled together';
SET @Ok = IIF(EXISTS (SELECT 1 FROM dbo.history_booking
                      WHERE booking_id = @D AND action = 'STATUS_CHANGE'
                        AND old_status = 'Pending' AND new_status = 'Cancelled'), 1, 0);
EXEC #Assert @Ok, N'trg_bookings_audit logged the guest cancellation';

SET @Err = 0;
BEGIN TRY EXEC dbo.sp_CancelMyBooking @BookingId = @D, @UserId = @User; END TRY
BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH;
SET @Ok = IIF(@Err = 50031, 1, 0);
EXEC #Assert @Ok, N'an already cancelled booking cannot be cancelled again (50031)';

-- A booking whose check-in date has arrived (dates moved into the past for the test)
DELETE FROM @Result;
INSERT INTO @Result
EXEC dbo.sp_CreateBooking @UserId = @User, @UserEmail = NULL, @RoomId = 'room-002',
     @CheckIn = '2031-03-20', @CheckOut = '2031-03-21', @GuestCount = 1,
     @GuestName = N'Too Late', @GuestEmail = N't@t.vn', @GuestPhone = '0900000009';
SELECT @E = id FROM @Result;
UPDATE dbo.bookings SET check_in = '2020-01-01', check_out = '2020-01-02' WHERE id = @E;

SET @Err = 0;
BEGIN TRY EXEC dbo.sp_CancelMyBooking @BookingId = @E, @UserId = @User; END TRY
BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH;
SET @Ok = IIF(@Err = 50032 AND (SELECT status FROM dbo.bookings WHERE id = @E) = 'Pending', 1, 0);
EXEC #Assert @Ok, N'from the check-in date on the guest cannot cancel (50032)';

PRINT N'--- read procedures ---';

DECLARE @Json NVARCHAR(MAX);
DECLARE @Rooms TABLE (rooms_json NVARCHAR(MAX));
INSERT INTO @Rooms EXEC dbo.sp_GetRooms @CheckIn = '2031-01-10', @CheckOut = '2031-01-11';
SELECT @Json = rooms_json FROM @Rooms;
SET @Ok = IIF(ISJSON(@Json) = 1
              AND NOT EXISTS (SELECT 1 FROM OPENJSON(@Json) WITH (id VARCHAR(50)) WHERE id = 'room-001')
              AND (SELECT COUNT(*) FROM OPENJSON(@Json)) = 21, 1, 0);
EXEC #Assert @Ok, N'sp_GetRooms hides room-001 while it is booked (21 of 22 rooms)';

PRINT N'--- embedding invalidation triggers ---';

DECLARE @Vec NVARCHAR(MAX) = (SELECT CONCAT('[', STRING_AGG(CAST('0.01' AS VARCHAR(MAX)), ','), ']') FROM GENERATE_SERIES(1, 1024));
EXEC dbo.sp_UpsertRoomEmbedding @RoomId = 'room-021', @Embedding = @Vec, @Model = 'test';
UPDATE dbo.rooms SET description = description WHERE id = 'room-021';
SET @Ok = IIF(NOT EXISTS (SELECT 1 FROM dbo.room_embeddings WHERE room_id = 'room-021'), 1, 0);
EXEC #Assert @Ok, N'editing a room description deletes its stale vector';

EXEC dbo.sp_UpsertRoomEmbedding @RoomId = 'room-021', @Embedding = @Vec, @Model = 'test';
DELETE FROM dbo.room_amenities WHERE room_id = 'room-021' AND amenity_id = 'am-smarttv';
INSERT INTO dbo.room_amenities (room_id, amenity_id) VALUES ('room-021', 'am-smarttv');
SET @Ok = IIF(NOT EXISTS (SELECT 1 FROM dbo.room_embeddings WHERE room_id = 'room-021'), 1, 0);
EXEC #Assert @Ok, N'changing room amenities deletes its stale vector';

PRINT N'--- audit on delete ---';
DELETE FROM dbo.bookings WHERE id = @C;
SET @Ok = IIF(EXISTS (SELECT 1 FROM dbo.history_booking WHERE booking_id = @C AND action = 'DELETED'), 1, 0);
EXEC #Assert @Ok, N'audit row survives the deleted booking';
DELETE FROM dbo.history_booking WHERE booking_id = @C;  -- #Cleanup can no longer find @C

PRINT N'All tests passed.';
GO

EXEC #Cleanup;
GO
