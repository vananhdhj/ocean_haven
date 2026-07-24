<?php
// 1. THIẾT LẬP PHẢN HỒI DẠNG JSON
header('Content-Type: application/json; charset=utf-8'); // Khai báo chuẩn JSON để Javascript nhận biết và phân tích được kết quả

// 2. NHÚNG CÁC PHẦN MỀM HỆ THỐNG
require_once __DIR__ . '/../../auth/session.php'; // Kiểm tra người dùng đã đăng nhập chưa
require_once __DIR__ . '/../../config/db-connection.php'; // Mở kết nối cơ sở dữ liệu MySQL

// 3. KIỂM TRA ĐĂNG NHẬP
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthenticated']);
    exit;
}

// 4. LẤY DỮ LIỆU ĐẦU VÀO ĐƯỢC GỬI LÊN (Hỗ trợ JSON raw và Form post)
$input = json_decode(file_get_contents('php://input'), true) ?: $_POST; // Đọc luồng dữ liệu từ request AJAX gửi lên

$name  = trim($input['name']  ?? ''); // Lấy họ tên mới
$phone = trim($input['phone'] ?? ''); // Lấy SĐT mới

// 5. KIỂM TRA RÀNG BUỘC THÔNG TIN KHÔNG ĐƯỢC RỖNG
if (empty($name) || empty($phone)) {
    echo json_encode(['success' => false, 'message' => 'Name and phone are required.']);
    exit;
}

// 6. XỬ LÝ LƯU VÀO DATABASE
$user_id   = $_SESSION['user_id']; // Xác định user nào đang gửi request dựa vào Session
$id_esc    = mysqli_real_escape_string($conn, $user_id); // Chống SQL Injection
$name_esc  = mysqli_real_escape_string($conn, $name);
$phone_esc = mysqli_real_escape_string($conn, $phone);

// Thực thi câu lệnh SQL cập nhật Họ tên & Số điện thoại mới
$ok = mysqli_query($conn,
    "UPDATE USERS SET name = '$name_esc', phone = '$phone_esc'
     WHERE id = '$id_esc' LIMIT 1"
);

// 7. PHẢN HỒI KẾT QUẢ VÀ ĐỒNG BỘ LẠI PHIÊN LÀM VIỆC (SESSION)
if ($ok) {
    // Cập nhật lại session ngay lập tức để đồng bộ hiển thị lên navbar mà không cần khách F5 tải lại trang
    $_SESSION['user_name']  = $name;
    $_SESSION['user_phone'] = $phone;

    echo json_encode(['success' => true, 'message' => 'Profile updated successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . mysqli_error($conn)]);
}
