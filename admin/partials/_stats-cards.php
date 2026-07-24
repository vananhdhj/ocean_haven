<?php
// Tệp hiển thị giao diện HTML của các thẻ thống kê
// Nhận dữ liệu đầu vào là mảng $stats đã truy vấn ở file index.php
?>
<div class="stat-grid mb-2-5">
  <!-- Thẻ hiển thị tổng số đơn đặt phòng -->
  <div class="stat-card">
    <div class="stat-card-icon icon-blue">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
    </div>
    <div class="stat-card-label">Total Bookings</div>
    <div class="stat-card-value"><?= $stats['total_bookings'] ?></div>
  </div>
  
  <!-- Thẻ hiển thị số đơn Confirmed (Đã chốt) -->
  <div class="stat-card">
    <div class="stat-card-icon icon-green">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1-1z"/></svg>
    </div>
    <div class="stat-card-label">Confirmed</div>
    <div class="stat-card-value"><?= $stats['confirmed'] ?></div>
  </div>
  
  <!-- Thẻ hiển thị số đơn Pending (Chờ xử lý) -->
  <div class="stat-card">
    <div class="stat-card-icon icon-amber">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    </div>
    <div class="stat-card-label">Pending</div>
    <div class="stat-card-value"><?= $stats['pending'] ?></div>
  </div>
  
  <!-- Thẻ hiển thị số đơn Cancelled (Đã bị hủy) -->
  <div class="stat-card">
    <div class="stat-card-icon icon-red">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>
    </div>
    <div class="stat-card-label">Cancelled</div>
    <div class="stat-card-value"><?= $stats['cancelled'] ?></div>
  </div>
</div>
