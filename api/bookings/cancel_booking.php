<?php
// 1. CẤU HÌNH TRẢ VỀ DẠNG JSON
header('Content-Type: application/json; charset=utf-8');

// 2. NHÚNG CÁC PHẦN MỀM THƯ VIỆN HỆ THỐNG
require_once __DIR__ . '/../../auth/session.php'; // Quản lý đăng nhập session
require_once __DIR__ . '/../../config/db-connection.php'; // Kết nối cơ sở dữ liệu

// 3. YÊU CẦU ĐĂNG NHẬP MỚI ĐƯỢC HUỶ PHÒNG
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthenticated']);
    exit;
}

// 4. LẤY MÃ ĐƠN HÀNG (BOOKING ID) CẦN HUỶ GỬI TỪ CLIENT
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$booking_id = isset($input['booking_id']) ? trim($input['booking_id']) : '';

if (empty($booking_id)) {
    echo json_encode(['success' => false, 'message' => 'Booking ID is required.']);
    exit;
}

// 5. LÀM SẠCH VÀ TRUY VẤN LẤY CHI TIẾT ĐƠN HÀNG
$booking_id_esc  = mysqli_real_escape_string($conn, $booking_id);
$session_user_id = $_SESSION['user_id'];
$session_role    = $_SESSION['user_role'] ?? 'user';

// Tìm đơn hàng trong DB theo ID chính hoặc Mã booking code (OH-...)
$find_query = "SELECT id, user_id, status FROM BOOKINGS
               WHERE id = '$booking_id_esc' OR booking_code = '$booking_id_esc'
               LIMIT 1";
$find_res = mysqli_query($conn, $find_query);
$booking  = mysqli_fetch_assoc($find_res);

if (!$booking) {
    echo json_encode(['success' => false, 'message' => 'Booking not found.']);
    exit;
}

// 6. PHÂN QUYỀN HUỶ PHÒNG (Role-Based Access Control)
// Chỉ cho phép Admin HOẶC chính chủ nhân của đơn hàng đó được quyền huỷ
if ($session_role !== 'admin' && $booking['user_id'] !== $session_user_id) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You are not authorised to cancel this booking.']);
    exit;
}

// Nếu đơn hàng đã huỷ từ trước rồi thì thông báo thành công luôn
if ($booking['status'] === 'Cancelled') {
    echo json_encode(['success' => true, 'message' => 'Booking was already cancelled.']);
    exit;
}

$real_booking_id = $booking['id'];

// 7. CẬP NHẬT TRẠNG THÁI HUỶ VÀ GHI LOG LỊCH SỬ ĐƠN HÀNG
$update_query = "UPDATE BOOKINGS SET status = 'Cancelled' WHERE id = '$real_booking_id'";
if (mysqli_query($conn, $update_query)) {
    // Tạo ngẫu nhiên một mã log lịch sử
    $hist_id   = 'hist-' . bin2hex(random_bytes(8));
    // Xác định ai là người yêu cầu huỷ để ghi chú thích
    $hist_note = mysqli_real_escape_string($conn, "Booking cancelled by " . ($session_role === 'admin' ? 'admin' : 'guest') . " request.");
    // Insert log vào bảng lịch sử đơn
    mysqli_query($conn, "INSERT INTO HISTORY_BOOKING (id, booking_id, action, note)
                         VALUES ('$hist_id', '$real_booking_id', 'CANCELLED', '$hist_note')");

    echo json_encode(['success' => true, 'message' => 'Booking cancelled successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . mysqli_error($conn)]);
}
exit;
