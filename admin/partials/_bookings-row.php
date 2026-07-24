<?php
// Tệp hiển thị giao diện HTML của từng dòng đơn đặt phòng trong bảng
// Nhận các biến truyền vào: $row (chứa thông tin đơn) và $is_checkin_table (nếu hiển thị trong bảng check-in)

$is_checkin = isset($is_checkin_table) && $is_checkin_table; // Gán cờ check-in

// 1. PHÂN LOẠI MÀU SẮC CHO CÁC THẺ TRẠNG THÁI ĐƠN PHÒNG (BOOKING STATUS BADGE)
$pill = 'pill-pending';
if ($row['status'] === 'Confirmed') $pill = 'pill-confirmed';
if ($row['status'] === 'Cancelled') $pill = 'pill-cancelled';
if ($row['status'] === 'Completed') $pill = 'pill-completed';

// 2. PHÂN LOẠI MÀU SẮC CHO THẺ TRẠNG THÁI THANH TOÁN (PAYMENT STATUS BADGE)
$payPill = 'pill-pending';
$payStatus = $row['payment_status'] ?? 'None';
if ($payStatus === 'Completed') $payPill = 'pill-completed';
if ($payStatus === 'Failed' || $payStatus === 'Refunded') $payPill = 'pill-cancelled';
?>
<!-- Nếu là bảng check-in thì gắn class checkin-row để JS thực hiện phân trang ẩn hiện dòng phù hợp -->
<tr <?= $is_checkin ? 'class="checkin-row"' : '' ?>>
  
  <!-- Cột Ngày nhận phòng (Chỉ hiển thị khi hiển thị ở bảng check-in) -->
  <?php if ($is_checkin): ?>
    <td class="row-checkin-date"><?= htmlspecialchars($row['check_in']) ?></td>
  <?php endif; ?>
  
  <!-- Cột Mã đơn phòng -->
  <td><span class="font-mono row-booking-code font-bold"><?= htmlspecialchars($row['booking_code']) ?></span></td>
  
  <!-- Cột Họ tên và email của khách đặt phòng -->
  <td>
    <div class="row-guest-name"><?= htmlspecialchars($row['guest_name']) ?></div>
    <div class="row-guest-email"><?= htmlspecialchars($row['user_email'] ?? '—') ?></div>
  </td>
  
  <!-- Cột Số điện thoại liên hệ -->
  <td><?= htmlspecialchars($row['guest_phone'] ?: $row['user_phone'] ?: '—') ?></td>
  
  <!-- Cột Tên phòng đã đặt -->
  <td><?= htmlspecialchars($row['room_name'] ?? '—') ?></td>
  
  <!-- Cột Ngày check-in (Chỉ hiện khi xem ở khung search thông thường) -->
  <?php if (!$is_checkin): ?>
    <td><?= htmlspecialchars($row['check_in']) ?></td>
  <?php endif; ?>
  
  <!-- Cột Ngày trả phòng -->
  <td><?= htmlspecialchars($row['check_out']) ?></td>
  
  <!-- Cột Tổng số tiền thanh toán (Định dạng VND có dấu chấm ngăn cách) -->
  <td class="row-total-price"><?= number_format((float)$row['total_price'], 0, ',', '.') ?> VNĐ</td>
  
  <!-- Cột Badge trạng thái đơn hàng (Có thuộc tính ID để JS cập nhật trực tiếp không cần reload) -->
  <td><span class="status-pill <?= $pill ?>" id="status-<?= $row['booking_id'] ?>"><?= htmlspecialchars($row['status']) ?></span></td>
  
  <!-- Cột Badge trạng thái thanh toán -->
  <td><span class="status-pill <?= $payPill ?>"><?= htmlspecialchars($payStatus) ?></span></td>
  
  <!-- Cột các hành động dành riêng cho Admin -->
  <td>
    <div class="row-actions">
      <!-- Nút Check-out: Chỉ xuất hiện đối với đơn hàng đang ở trạng thái 'Confirmed' (Đã chốt) -->
      <?php if ($row['status'] === 'Confirmed'): ?>
        <button class="btn-primary checkout-btn" data-id="<?= $row['booking_id'] ?>">
          Check-out
        </button>
      <?php endif; ?>
      
      <!-- Nút Cancel (Hủy đơn): Chỉ hiển thị khi đơn đang ở trạng thái 'Pending' hoặc 'Confirmed' -->
      <?php if (in_array($row['status'], ['Pending', 'Confirmed'])): ?>
        <button class="cancel-btn" data-id="<?= $row['booking_id'] ?>">
          Cancel
        </button>
      <?php endif; ?>
      
      <!-- Nếu là đơn Completed hoặc Cancelled thì không cần thao tác gì thêm, hiển thị dấu gạch ngang -->
      <?php if (!in_array($row['status'], ['Pending', 'Confirmed'])): ?>
        <span class="no-action">—</span>
      <?php endif; ?>
    </div>
  </td>
</tr>
