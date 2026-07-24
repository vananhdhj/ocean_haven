<?php
// 1. THIẾT LẬP PHẢN HỒI LÀ JSON CHO FRONTEND
header('Content-Type: application/json; charset=utf-8'); // Thiết lập định dạng dữ liệu trả về là JSON

// 2. NHÚNG CÁC FILE LIÊN KẾT HỆ THỐNG
require_once __DIR__ . '/../../auth/session.php'; // Quản lý trạng thái đăng nhập session
require_once __DIR__ . '/../../config/db-connection.php'; // Biến kết nối database $conn

// 3. KIỂM TRA QUYỀN TRUY CẬP (ĐÃ ĐĂNG NHẬP CHƯA?)
if (!isLoggedIn()) { // Nếu chưa đăng nhập
    http_response_code(401); // Trả về mã lỗi 401 Unauthenticated
    echo json_encode(['error' => 'Unauthenticated']); // Báo lỗi JSON cho javascript frontend biết để đá ra trang chủ hoặc hiện modal
    exit;
}

// 4. LẤY ID NGƯỜI DÙNG TỪ SESSION VÀ TRUY VẤN CSDL
$user_id = $_SESSION['user_id']; // Lấy ID người dùng lưu tạm trong session từ lúc đăng nhập thành công
$id_esc  = mysqli_real_escape_string($conn, $user_id); // Làm sạch ID để chống lỗi bảo mật SQL Injection

// Truy vấn lấy dữ liệu chi tiết của người dùng
$row = mysqli_fetch_assoc(
    mysqli_query($conn, "SELECT id, name, email, phone, role, avatar, create_at
                         FROM USERS WHERE id = '$id_esc' LIMIT 1")
);

// 5. TRẢ VỀ LỖI NẾU KHÔNG TÌM THẤY USER
if (!$row) {
    http_response_code(404); // Trả về mã lỗi 404 Not Found
    echo json_encode(['error' => 'User not found']);
    exit;
}

// 6. GỬI DỮ LIỆU PROFILE DẠNG JSON VỀ CHO FRONTEND HIỂN THỊ
echo json_encode([
    'id'         => $row['id'],
    'name'       => $row['name'],
    'email'      => $row['email'],
    'phone'      => $row['phone'],
    'role'       => $row['role'],
    'avatar_url' => $row['avatar'], // Trả về link ảnh avatar thực tế của người dùng
    'joined'     => date('Y', strtotime($row['create_at'])), // Trích xuất năm tham gia từ ngày tạo tài khoản
]);
