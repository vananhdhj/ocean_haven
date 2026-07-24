<?php
// Tệp hiển thị bảng danh sách các lịch nhận phòng (check-in) sắp tới
// Nhận biến đầu vào là mảng $checkins_by_date từ file index.php
?>
<div class="admin-card mb-2-5">
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
          <th>Booking Status</th>
          <th>Payment</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <!-- Nếu không có ai check-in trong ngày -->
        <?php if (empty($checkins_by_date)): ?>
          <tr><td colspan="10" class="table-empty">No check-ins scheduled.</td></tr>
        <?php else: ?>
          <!-- Lặp qua mảng check-in và nhúng file hiển thị từng dòng đơn đặt phòng -->
          <?php foreach ($checkins_by_date as $row): ?>
            <?php 
              $is_checkin_table = true; // Đánh dấu đây là bảng danh sách nhận phòng check-in chính thức để hiện thêm cột Ngày Check-in ở dòng tương ứng
              include __DIR__ . '/_bookings-row.php'; 
            ?>
          <?php endforeach; ?>
        <?php endif; ?>
      </tbody>
    </table>
  </div>

  <!-- Pagination Container (Vùng chứa thanh phân trang, được điều khiển và gán giao diện động qua Javascript admin-dashboard.js) -->
  <div id="checkins-pagination-container" class="pagination-container" style="display: none;"></div>
</div>
