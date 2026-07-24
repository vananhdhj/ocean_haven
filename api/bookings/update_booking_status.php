<?php
// 1. CẤU HÌNH PHẢN HỒI LÀ JSON CHO AJAX
header('Content-Type: application/json; charset=utf-8');

// 2. NHÚNG CÁC PHẦN MỀM THƯ VIỆN HỆ THỐNG
require_once __DIR__ . '/../../auth/session.php'; // Quản lý đăng nhập session
require_once __DIR__ . '/../../config/db-connection.php'; // Kết nối cơ sở dữ liệu

// 3. PHÂN QUYỀN TRUY CẬP (BẮT BUỘC PHẢI LÀ ADMIN MỚI ĐƯỢC THAY ĐỔI TRẠNG THÁI)
if (!isLoggedIn() || currentUser()['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// 4. LẤY DỮ LIỆU ĐẦU VÀO ĐƯỢC GỬI LÊN TỪ ADMIN DASHBOARD
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['booking_id']) || !isset($input['status'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

$booking_id = mysqli_real_escape_string($conn, $input['booking_id']); // ID đơn phòng cần cập nhật
$new_status = mysqli_real_escape_string($conn, $input['status']); // Trạng thái mới (Vd: Completed để checkout)

// 5. THỰC THI CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
$updateSql = "UPDATE BOOKINGS SET status = '$new_status' WHERE id = '$booking_id'";
if (mysqli_query($conn, $updateSql)) {
    // 6. GHI NHẬN HÀNH ĐỘNG VÀO LỊCH SỬ HÓA ĐƠN ĐỂ TRUY VẾT
    $adminName = mysqli_real_escape_string($conn, currentUser()['name']); // Lấy tên Admin thực hiện hành động
    $note = "Admin $adminName marked booking as $new_status"; // Ghi chú thích
    $logId = bin2hex(random_bytes(16)); // Tạo ID log ngẫu nhiên
    
    // Ghi log
    mysqli_query($conn, "INSERT INTO HISTORY_BOOKING (id, booking_id, action, note) 
                         VALUES ('$logId', '$booking_id', 'STATUS_UPDATED', '$note')");
    
    echo json_encode(['success' => true, 'message' => 'Booking status updated successfully']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update booking status: ' . mysqli_error($conn)]);
}
