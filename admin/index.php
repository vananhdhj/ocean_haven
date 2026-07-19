<?php
require_once __DIR__ . '/../auth/session.php';
require_once __DIR__ . '/../config/db-connection.php';
requireAdmin(); // Redirects to 403 if not admin

$admin = currentUser();

// ── Stats ───────────────────────────────────────────────────────────────
$total_bookings   = (int)(mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM BOOKINGS"))['c'] ?? 0);
$confirmed        = (int)(mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM BOOKINGS WHERE status='Confirmed'"))['c'] ?? 0);
$pending          = (int)(mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM BOOKINGS WHERE status='Pending'"))['c'] ?? 0);
$cancelled        = (int)(mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM BOOKINGS WHERE status='Cancelled'"))['c'] ?? 0);
$total_users      = (int)(mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM USERS WHERE role='user'"))['c'] ?? 0);
$revenue_row      = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COALESCE(SUM(amount),0) AS rev FROM PAYMENTS WHERE status='Completed'"));
$total_revenue    = (float)($revenue_row['rev'] ?? 0);
$total_rooms      = (int)(mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM ROOMS WHERE is_active=1"))['c'] ?? 0);

// ── Search customer booking history via phone number ────────────────────
$phone_search = isset($_GET['phone_search']) ? trim($_GET['phone_search']) : '';
$search_results = [];
if ($phone_search !== '') {
    $phone_esc = mysqli_real_escape_string($conn, $phone_search);
    $search_res = mysqli_query($conn,
        "SELECT b.booking_code, b.guest_name, b.guest_phone, b.check_in, b.check_out, b.total_price, b.status, b.create_at,
                r.name AS room_name, u.email AS user_email, u.phone AS user_phone
         FROM BOOKINGS b
         LEFT JOIN ROOMS r ON b.room_id = r.id
         LEFT JOIN USERS u ON b.user_id = u.id
         WHERE b.guest_phone LIKE '%$phone_esc%' OR u.phone LIKE '%$phone_esc%'
         ORDER BY b.check_in DESC"
    );
    while ($row = mysqli_fetch_assoc($search_res)) {
        $search_results[] = $row;
    }
}

// ── Check-ins by Date ──────────────────────────────────────────────────
$checkins_res = mysqli_query($conn,
    "SELECT b.booking_code, b.guest_name, b.guest_phone, b.check_in, b.check_out, b.total_price, b.status,
            r.name AS room_name, u.email AS user_email, u.phone AS user_phone
     FROM BOOKINGS b
     LEFT JOIN ROOMS r ON b.room_id = r.id
     LEFT JOIN USERS u ON b.user_id = u.id
     ORDER BY b.check_in ASC"
);
$checkins_by_date = [];
while ($row = mysqli_fetch_assoc($checkins_res)) {
    $checkins_by_date[] = $row;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard — Ocean Haven Hotel</title>
  <link rel="stylesheet" href="/final_assigment/assets/css/global.css">
  <link rel="stylesheet" href="/final_assigment/assets/css/admin.css">
</head>
<body>
<div class="admin-wrap">

  <!-- Top bar -->
  <div class="admin-topbar">
    <div class="admin-topbar-brand">
      <div class="admin-topbar-brand-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      Ocean Haven &nbsp;<span class="admin-topbar-badge">Admin</span>
    </div>
    <div class="admin-topbar-right">
      <span style="color:rgba(255,255,255,0.5);">
        <?= htmlspecialchars($admin['name']) ?>
      </span>
      <a href="/final_assigment/home.php">← Front End</a>
      <a href="/final_assigment/auth/logout.php" style="color:#f87171;">Sign Out</a>
    </div>
  </div>

  <!-- Main -->
  <main class="admin-main">
    <h1 class="admin-page-title">Dashboard</h1>
    <p class="admin-page-subtitle">Welcome back, <?= htmlspecialchars($admin['name']) ?>. Here's what's happening today.</p>

    <!-- Stats -->
    <div class="stat-grid" style="margin-bottom: 2.5rem;">
      <div class="stat-card">
        <div class="stat-card-icon icon-blue">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
        </div>
        <div class="stat-card-label">Total Bookings</div>
        <div class="stat-card-value"><?= $total_bookings ?></div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon icon-green">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1-1z"/></svg>
        </div>
        <div class="stat-card-label">Confirmed</div>
        <div class="stat-card-value"><?= $confirmed ?></div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon icon-amber">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="stat-card-label">Pending</div>
        <div class="stat-card-value"><?= $pending ?></div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon icon-red">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>
        </div>
        <div class="stat-card-label">Cancelled</div>
        <div class="stat-card-value"><?= $cancelled ?></div>
      </div>
    </div>

    <!-- Phone Search Panel -->
    <div class="admin-card" style="margin-bottom: 2.5rem; padding: 1.5rem;">
      <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem;">Search Customer Booking History</h2>
      <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 1.25rem;">
        Lookup customer bookings and details instantly using their phone number during check-in.
      </p>
      <form method="GET" action="index.php" style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <input type="text" name="phone_search" placeholder="Enter guest phone number..." 
               class="form-control" style="max-width: 350px; background-color: #fff; border: 1.5px solid var(--border);"
               value="<?= htmlspecialchars($phone_search) ?>" required>
        <button type="submit" class="btn-primary" style="padding: 0.625rem 1.5rem; border-radius: var(--radius-md); font-weight: 600; font-family: var(--font-body); border: none; cursor: pointer;">
          Search
        </button>
        <?php if ($phone_search !== ''): ?>
          <a href="index.php" style="align-self: center; font-size: 0.875rem; color: var(--primary-light); text-decoration: underline; font-weight: 600; margin-left: 0.5rem;">Clear Search</a>
        <?php endif; ?>
      </form>

      <?php if ($phone_search !== ''): ?>
        <div style="margin-top: 1.5rem; overflow-x: auto;">
          <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem;">Search Results for "<?= htmlspecialchars($phone_search) ?>"</h3>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Booking Code</th>
                <th>Guest</th>
                <th>Phone</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <?php if (empty($search_results)): ?>
                <tr><td colspan="8" style="text-align:center;color:var(--muted-foreground);padding:2rem;">No booking history found for this phone number.</td></tr>
              <?php else: ?>
                <?php foreach ($search_results as $b): ?>
                  <?php
                    $pill = 'pill-pending';
                    if ($b['status'] === 'Confirmed') $pill = 'pill-confirmed';
                    if ($b['status'] === 'Cancelled') $pill = 'pill-cancelled';
                    if ($b['status'] === 'Completed') $pill = 'pill-completed';
                  ?>
                  <tr>
                    <td><span class="font-mono font-bold" style="font-size:0.8125rem;"><?= htmlspecialchars($b['booking_code']) ?></span></td>
                    <td>
                      <div style="font-weight:600;"><?= htmlspecialchars($b['guest_name']) ?></div>
                      <div style="font-size:0.75rem;color:var(--muted-foreground);"><?= htmlspecialchars($b['user_email'] ?? '—') ?></div>
                    </td>
                    <td><?= htmlspecialchars($b['guest_phone'] ?: $b['user_phone'] ?: '—') ?></td>
                    <td><?= htmlspecialchars($b['room_name'] ?? '—') ?></td>
                    <td><?= htmlspecialchars($b['check_in']) ?></td>
                    <td><?= htmlspecialchars($b['check_out']) ?></td>
                    <td style="font-weight:700;"><?= number_format((float)$b['total_price'], 0, ',', '.') ?> VNĐ</td>
                    <td><span class="status-pill <?= $pill ?>"><?= htmlspecialchars($b['status']) ?></span></td>
                  </tr>
                <?php endforeach; ?>
              <?php endif; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>
    </div>

    <!-- Check-ins by Date Table -->
    <div class="admin-card" style="margin-bottom: 2.5rem;">
      <div class="admin-card-header">
        <h2>Check-in Schedule (by Date)</h2>
      </div>
      <div style="overflow-x:auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Check-in Date</th>
              <th>Booking Code</th>
              <th>Guest Name</th>
              <th>Phone</th>
              <th>Room</th>
              <th>Check-out Date</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <?php if (empty($checkins_by_date)): ?>
              <tr><td colspan="8" style="text-align:center;color:var(--muted-foreground);padding:2rem;">No check-ins scheduled.</td></tr>
            <?php else: ?>
              <?php foreach ($checkins_by_date as $c): ?>
                <?php
                  $pill = 'pill-pending';
                  if ($c['status'] === 'Confirmed') $pill = 'pill-confirmed';
                  if ($c['status'] === 'Cancelled') $pill = 'pill-cancelled';
                  if ($c['status'] === 'Completed') $pill = 'pill-completed';
                ?>
                <tr>
                  <td style="font-weight: 600; color: var(--primary-light);"><?= htmlspecialchars($c['check_in']) ?></td>
                  <td><span class="font-mono font-bold" style="font-size:0.8125rem;"><?= htmlspecialchars($c['booking_code']) ?></span></td>
                  <td>
                    <div style="font-weight:600;"><?= htmlspecialchars($c['guest_name']) ?></div>
                    <div style="font-size:0.75rem;color:var(--muted-foreground);"><?= htmlspecialchars($c['user_email'] ?? '—') ?></div>
                  </td>
                  <td><?= htmlspecialchars($c['guest_phone'] ?: $c['user_phone'] ?: '—') ?></td>
                  <td><?= htmlspecialchars($c['room_name'] ?? '—') ?></td>
                  <td><?= htmlspecialchars($c['check_out']) ?></td>
                  <td style="font-weight:700;"><?= number_format((float)$c['total_price'], 0, ',', '.') ?> VNĐ</td>
                  <td><span class="status-pill <?= $pill ?>"><?= htmlspecialchars($c['status']) ?></span></td>
                </tr>
              <?php endforeach; ?>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>

  </main>

</div>

</body>
</html>
