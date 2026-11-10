/* ============================================================
   Ocean Haven Hotel — index demonstration
   Run with: npm run db:run -- tests/index_demo.sql
   (or in SSMS with "Include Actual Execution Plan" turned on)

   1. Loads 50,600 synthetic historical bookings (inside a transaction).
   2. Runs each important query twice with SET STATISTICS IO ON:
        a) normally, so the optimizer uses the index from 02_indexes.sql
        b) forced to scan the clustered index, i.e. "as if there were no index"
      and compares the number of 8 KB pages read ("logical reads").
   3. ROLLBACK: the database is left exactly as it was.
   ============================================================ */
USE OceanHaven;
GO

SET NOCOUNT ON;
BEGIN TRANSACTION;

DECLARE @DemoUser UNIQUEIDENTIFIER = '33333333-3333-3333-3333-333333333333';

-- 22 rooms x 2,300 stays of 2 nights, 2000-2018, all Completed or Cancelled,
-- like the history of a hotel that has been running for years.
INSERT INTO dbo.bookings (user_id, room_id, check_in, check_out, guest_count, guest_name,
                          guest_email, guest_phone, total_price, status, created_at)
SELECT CASE WHEN n.value % 500 = 0 THEN @DemoUser ELSE NEWID() END,
       r.id,
       DATEADD(DAY, 3 * n.value, '2000-01-01'),
       DATEADD(DAY, 3 * n.value + 2, '2000-01-01'),
       2, N'Demo Guest', N'demo@oceanhaven.vn',
       CONCAT('09', RIGHT(CONCAT('0000000', ABS(CHECKSUM(NEWID())) % 100000000), 8)),
       r.price * 2,
       CASE WHEN n.value % 10 = 0 THEN 'Cancelled' ELSE 'Completed' END,
       DATEADD(DAY, 3 * n.value - 7, '2000-01-01')
FROM dbo.rooms AS r
CROSS JOIN GENERATE_SERIES(0, 2299) AS n;

INSERT INTO dbo.payments (booking_id, payment_method, amount, status)
SELECT b.id, 'cod', b.total_price, CASE b.status WHEN 'Completed' THEN 'Completed' WHEN 'Cancelled' THEN 'Cancelled' ELSE 'Pending' END
FROM dbo.bookings AS b
WHERE NOT EXISTS (SELECT 1 FROM dbo.payments AS p WHERE p.booking_id = b.id);

UPDATE STATISTICS dbo.bookings;
UPDATE STATISTICS dbo.payments;

DECLARE @Rows INT = (SELECT COUNT(*) FROM dbo.bookings);
PRINT CONCAT(N'Loaded ', @Rows, N' bookings. Lines below: "Table ''bookings''. ... logical reads N" = pages read.');

DECLARE @n INT;

SET STATISTICS IO ON;

PRINT N'';
PRINT N'=== 1. Availability check (room-013, 2027-01-01 .. 2027-01-05) ===';
PRINT N'--- with IX_bookings_active_room_dates (filtered: only Pending/Confirmed rows)';
SELECT @n = COUNT(*) FROM dbo.bookings
WHERE room_id = 'room-013' AND status IN ('Pending', 'Confirmed')
  AND check_in < '2027-01-05' AND check_out > '2027-01-01';
PRINT N'--- forced clustered index scan (no index)';
SELECT @n = COUNT(*) FROM dbo.bookings WITH (INDEX(PK_bookings))
WHERE room_id = 'room-013' AND status IN ('Pending', 'Confirmed')
  AND check_in < '2027-01-05' AND check_out > '2027-01-01';

PRINT N'';
PRINT N'=== 2. My bookings, newest first (profile page) ===';
PRINT N'--- with IX_bookings_user_created';
SELECT TOP (100) @n = id FROM dbo.bookings WHERE user_id = @DemoUser ORDER BY created_at DESC;
PRINT N'--- forced clustered index scan (no index) + sort';
SELECT TOP (100) @n = id FROM dbo.bookings WITH (INDEX(PK_bookings)) WHERE user_id = @DemoUser ORDER BY created_at DESC;

PRINT N'';
PRINT N'=== 3. Admin phone search ===';
PRINT N'--- prefix LIKE ''0912%'' seeks IX_bookings_guest_phone';
SELECT @n = COUNT(*) FROM dbo.bookings WHERE guest_phone LIKE '0912%';
PRINT N'--- leading wildcard LIKE ''%0912%'' cannot seek, must read every row';
SELECT @n = COUNT(*) FROM dbo.bookings WHERE guest_phone LIKE '%0912%';

PRINT N'';
PRINT N'=== 4. Lookup by booking code ===';
PRINT N'--- with UX_bookings_booking_code';
SELECT @n = id FROM dbo.bookings WHERE booking_code = 'OH025000';
PRINT N'--- forced clustered index scan (no index)';
SELECT @n = id FROM dbo.bookings WITH (INDEX(PK_bookings)) WHERE booking_code = 'OH025000';

PRINT N'';
PRINT N'=== 5. Revenue on the admin dashboard ===';
DECLARE @Revenue DECIMAL(18,2);
PRINT N'--- covering IX_payments_status (status, INCLUDE amount)';
SELECT @Revenue = SUM(amount) FROM dbo.payments WHERE status = 'Completed';
PRINT N'--- forced clustered index scan (no index)';
SELECT @Revenue = SUM(amount) FROM dbo.payments WITH (INDEX(PK_payments)) WHERE status = 'Completed';

SET STATISTICS IO OFF;

ROLLBACK TRANSACTION;
PRINT N'';
PRINT N'Rolled back: demo data removed.';
GO
