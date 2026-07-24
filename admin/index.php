<?php
// 1. NHÚNG CÁC CÔNG CỤ XÁC THỰC VÀ TRUY VẤN
require_once __DIR__ . '/../auth/session.php'; // Quản lý đăng nhập session
require_once __DIR__ . '/../config/db-connection.php'; // Kết nối cơ sở dữ liệu MySQL ($conn)
require_once __DIR__ . '/dashboard-data.php'; // Chứa các hàm lấy dữ liệu thống kê cho Dashboard

// 2. KIỂM TRA QUYỀN ADMIN (CHỈ ADMIN MỚI ĐƯỢC PHÉP TRUY CẬP)
requireAdmin(); // Tự động chuyển hướng về trang 403 hoặc đăng nhập nếu không phải admin

$admin = currentUser(); // Lấy thông tin admin đang đăng nhập hiện tại

// 3. LẤY SỐ LIỆU THỐNG KÊ TOÀN DIỆN (TỔNG ĐƠN, DOANH THU, PENDING...)
$stats = getDashboardStats($conn);

// 4. XỬ LÝ KHUNG TÌM KIẾM THEO SỐ ĐIỆN THOẠI KHÁCH HÀNG (CHO CHECK-IN)
$phone_search = isset($_GET['phone_search']) ? trim($_GET['phone_search']) : '';
$search_results = searchBookingsByPhone($conn, $phone_search); // Hàm truy vấn tìm kiếm đơn hàng theo số điện thoại

// 5. LẤY LỊCH TRÌNH NHẬN PHÒNG (CHECK-IN) HÀNG NGÀY
$checkins_by_date = getCheckinsByDate($conn); // Lấy danh sách check-in sắp xếp ngày mới nhất lên đầu
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard — Ocean Haven Hotel</title>
  <link rel="stylesheet" href="/ocean_haven/assets/css/global.css">
  <link rel="stylesheet" href="/ocean_haven/assets/css/admin.css">
</head>
<body>
<div class="admin-wrap">

  <!-- Top bar (Thanh điều hướng phía trên) -->
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
      <span class="topbar-username">
        <?= htmlspecialchars($admin['name']) ?>
      </span>
      <a href="/ocean_haven/home.php">← Front End</a>
      <a href="/ocean_haven/auth/logout.php" class="topbar-logout">Sign Out</a>
    </div>
  </div>

  <!-- Main (Nội dung chính hiển thị các Dashboard panels) -->
  <main class="admin-main">
    <h1 class="admin-page-title">Dashboard</h1>
    <p class="admin-page-subtitle">Welcome back, <?= htmlspecialchars($admin['name']) ?>. Here's what's happening today.</p>

    <!-- Stats (Khối hiển thị thẻ thống kê tổng quan ở trên cùng) -->
    <?php include __DIR__ . '/partials/_stats-cards.php'; ?>

    <!-- Phone Search Panel (Khối tìm kiếm nhanh đơn đặt phòng theo SĐT) -->
    <?php include __DIR__ . '/partials/_search-panel.php'; ?>

    <!-- Check-ins by Date Table (Khối hiển thị lịch trình Check-in) -->
    <?php include __DIR__ . '/partials/_checkins-table.php'; ?>

  </main>

</div>

<!-- Nhúng Javascript xử lý tác vụ Check-out, Hủy đơn không đồng bộ (Ajax) và phân trang -->
<script src="/ocean_haven/assets/js/admin-dashboard.js"></script>
</body>
</html>
