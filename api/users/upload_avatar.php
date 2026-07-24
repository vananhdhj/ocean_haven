<?php
// 1. THIẾT LẬP KIỂU PHẢN HỒI JSON
header('Content-Type: application/json; charset=utf-8');

// 2. NHÚNG CÁC PHẦN MỀM HỆ THỐNG
require_once __DIR__ . '/../../auth/session.php'; // Kiểm tra quyền đăng nhập session
require_once __DIR__ . '/../../config/db-connection.php'; // Kết nối cơ sở dữ liệu

// 3. XÁC MINH QUYỀN TRUY CẬP (BẮT BUỘC ĐĂNG NHẬP MỚI ĐƯỢC UPLOAD)
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please log in to upload avatar.']);
    exit;
}

$session_user_id = $_SESSION['user_id'];
$user_id_esc     = mysqli_real_escape_string($conn, $session_user_id);

// 4. KIỂM TRA FILE ĐÃ ĐƯỢC TẢI LÊN CHƯA VÀ CÓ BỊ LỖI KHÔNG
if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400); // Lỗi yêu cầu không hợp lệ
    echo json_encode(['success' => false, 'message' => 'No file uploaded or upload error occurred.']);
    exit;
}

$file = $_FILES['avatar']; // Lấy mảng thông tin file tải lên

// 5. RÀNG BUỘC KÍCH THƯỚC FILE (Tối đa 5MB)
$maxSize = 5 * 1024 * 1024; // Tính toán 5MB = 5 * 1024 KB * 1024 Bytes
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'File size exceeds 5MB limit.']);
    exit;
}

// 6. KIỂM TRA ĐỊNH DẠNG HÌNH ẢNH HỢP LỆ
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']; // Danh sách đuôi file ảnh cho phép
$fileExtension     = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)); // Lấy ra phần mở rộng (đuôi file) của ảnh

if (!in_array($fileExtension, $allowedExtensions)) { // Nếu đuôi file không nằm trong danh sách cho phép
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid file format. Only JPG, PNG, GIF, and WEBP are allowed.']);
    exit;
}

// 7. THIẾT LẬP THƯ MỤC LƯU TRỮ TRÊN SERVER
$targetDir = __DIR__ . '/../public/images/'; // Thư mục lưu ảnh avatar thực tế
if (!is_dir($targetDir)) { // Nếu thư mục chưa tồn tại (Vd: lần đầu chạy dự án)
    mkdir($targetDir, 0777, true); // Tự động tạo thư mục với toàn quyền ghi đọc
}

// 8. ĐẶT TÊN FILE ẢNH DUY NHẤT (Tránh việc đè ảnh của user khác)
$uniqueFilename = 'avatar_' . $session_user_id . '_' . time() . '.' . $fileExtension; // Tạo tên file theo định dạng: avatar_{user_id}_{timestamp}.{đuôi_file}
$targetFilePath = $targetDir . $uniqueFilename; // Đường dẫn vật lý đầy đủ để lưu file trên đĩa cứng máy chủ

// 9. DI CHUYỂN FILE TỪ THƯ MỤC TẠM SANG THƯ MỤC CHÍNH THỨC CỦA WEB
if (!move_uploaded_file($file['tmp_name'], $targetFilePath)) { // Lấy file từ bộ nhớ tạm tmp_name lưu vào targetFilePath
    http_response_code(500); // Lỗi máy chủ
    echo json_encode(['success' => false, 'message' => 'Failed to save uploaded image file.']);
    exit;
}

// 10. CẬP NHẬT ĐƯỜNG DẪN ẢNH VÀO CƠ SỞ DỮ LIỆU
$avatarUrl = '/ocean_haven/public/images/' . $uniqueFilename; // Đường dẫn tương đối từ gốc web để lưu vào DB (dùng hiển thị ở frontend)
$avatarUrlEsc = mysqli_real_escape_string($conn, $avatarUrl);

// Chạy SQL UPDATE lưu đường dẫn ảnh đại diện cho user
$query = "UPDATE USERS SET avatar = '$avatarUrlEsc' WHERE id = '$user_id_esc' LIMIT 1";
if (mysqli_query($conn, $query)) {
    echo json_encode([
        'success'    => true,
        'message'    => 'Avatar updated successfully.',
        'avatar_url' => $avatarUrl // Trả link ảnh mới về cho Javascript thay thế ngay trên giao diện
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database update error: ' . mysqli_error($conn)
    ]);
}
