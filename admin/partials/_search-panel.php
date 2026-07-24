<?php
// Tệp hiển thị giao diện HTML của ô tìm kiếm lịch sử đặt phòng bằng số điện thoại
// Sử dụng các biến $phone_search và $search_results từ file index.php
?>
<div class="admin-card mb-2-5" style="padding: 1.5rem;">
  <h2 class="dashboard-heading">Search Customer Booking History</h2>
  <p class="dashboard-subtitle">
    Lookup customer bookings and details instantly using their phone number during check-in.
  </p>
  
  <!-- Form tìm kiếm gửi dữ liệu qua phương thức GET tới trang index.php -->
  <form method="GET" action="index.php" class="search-form">
    <input type="text" name="phone_search" placeholder="Enter guest phone number..." 
           class="form-control search-input"
           value="<?= htmlspecialchars($phone_search) ?>" required>
    <button type="submit" class="btn-primary search-btn">
      Search
    </button>
    <!-- Nếu đang thực hiện tìm kiếm, hiển thị nút bấm Clear để xoá bộ lọc quay về trang tổng quan mặc định -->
    <?php if ($phone_search !== ''): ?>
      <a href="index.php" class="search-clear-link">Clear Search</a>
    <?php endif; ?>
  </form>

  <!-- Nếu người dùng có bấm tìm kiếm thì hiển thị bảng kết quả ra màn hình -->
  <?php if ($phone_search !== ''): ?>
    <div class="table-responsive">
      <h3 class="dashboard-heading-sm">Search Results for "<?= htmlspecialchars($phone_search) ?>"</h3>
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
            <th>Booking Status</th>
            <th>Payment</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <!-- Nếu mảng kết quả trống thì hiển thị dòng thông báo không có dữ liệu -->
          <?php if (empty($search_results)): ?>
            <tr><td colspan="10" class="table-empty">No booking history found for this phone number.</td></tr>
          <?php else: ?>
            <!-- Lặp qua mảng kết quả tìm thấy và nhúng file _bookings-row.php để hiển thị từng dòng đơn hàng -->
            <?php foreach ($search_results as $row): ?>
              <?php 
                $is_checkin_table = false; // Đánh dấu đây không phải là bảng danh sách nhận phòng check-in chính thức
                include __DIR__ . '/_bookings-row.php'; 
              ?>
            <?php endforeach; ?>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  <?php endif; ?>
</div>
