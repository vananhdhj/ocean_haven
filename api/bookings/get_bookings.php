<?php
// 1. CẤU HÌNH PHẢN HỒI JSON DÙNG CHO AJAX
header('Content-Type: application/json; charset=utf-8');

// 2. NHÚNG PHẦN MỀM THƯ VIỆN HỆ THỐNG
require_once __DIR__ . '/../../auth/session.php'; // Quản lý tài khoản session
require_once __DIR__ . '/../../config/db-connection.php'; // Kết nối cơ sở dữ liệu

// 3. KIỂM TRA ĐĂNG NHẬP
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthenticated']);
    exit;
}

$session_user_id = $_SESSION['user_id'];
$session_role    = $_SESSION['user_role'] ?? 'user';

// 4. KIỂM TRA PHÂN QUYỀN TRUY CẬP XEM LỊCH SỬ ĐƠN HÀNG
// Quyền Admin: Có thể truyền thêm tham số ?user_id= để tra cứu lịch sử đặt phòng của một khách bất kỳ
if ($session_role === 'admin' && !empty($_GET['user_id'])) {
    $target_id = trim($_GET['user_id']);
} else {
    // Người dùng thường: Chỉ xem được chính đơn hàng của bản thân họ
    $target_id = $session_user_id;
}

$id_esc = mysqli_real_escape_string($conn, $target_id);

// 5. TRUY VẤN LẤY DANH SÁCH ĐƠN ĐẶT PHÒNG CỦA ĐỐI TƯỢNG XÁC ĐỊNH
$query = "SELECT b.id, b.booking_code, b.check_in, b.check_out, b.guest_count,
                 b.total_price, b.status, b.create_at, r.name AS room_name, p.status AS payment_status
          FROM BOOKINGS b
          JOIN ROOMS r ON b.room_id = r.id
          LEFT JOIN PAYMENTS p ON b.id = p.booking_id
          WHERE b.user_id = '$id_esc'
          ORDER BY b.create_at DESC"; // Sắp xếp theo ngày tạo mới nhất lên hàng đầu

$result   = mysqli_query($conn, $query);
$bookings = []; // Mảng chứa danh sách các đơn

// 6. DUYỆT QUA CÁC DÒNG KẾT QUẢ ĐỔ VÀO MẢNG
if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $bookings[] = [
            'id'             => $row['id'],
            'booking_code'   => $row['booking_code'],
            'room'           => $row['room_name'],
            'check_in'       => $row['check_in'],
            'check_out'      => $row['check_out'],
            'guests'         => (int)$row['guest_count'],
            'status'         => $row['status'],
            'payment_status' => $row['payment_status'] ?? 'None',
            'bookedOn'       => $row['create_at'],
            'total'          => (float)$row['total_price'],
        ];
    }
}

// 7. TRẢ KẾT QUẢ DẠNG JSON VỀ CHO MÀN HÌNH KHÁCH HÀNG
echo json_encode($bookings);
exit;
