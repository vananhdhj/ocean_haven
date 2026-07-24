<?php
// 1. NHÚNG CÁC CÔNG CỤ CẦN THIẾT
require_once __DIR__ . '/session.php'; // Gọi file quản lý Session đăng nhập
require_once __DIR__ . '/../config/db-connection.php'; // Gọi file kết nối CSDL MySQL (tạo ra biến kết nối $conn)

header('Content-Type: application/json; charset=utf-8'); // Thiết lập định dạng dữ liệu trả về là JSON (dùng cho AJAX ở Frontend)

// 2. CHỈ CHO PHÉP PHƯƠNG THỨC POST GỬI LÊN
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { // Kiểm tra nếu yêu cầu không phải là POST
    http_response_code(405); // Báo lỗi phương thức không được hỗ trợ
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']); // Trả về thông báo lỗi dạng JSON
    exit;
}

// 3. NẾU ĐÃ ĐĂNG NHẬP RỒI THÌ BÁO THÀNH CÔNG LUÔN
if (isLoggedIn()) {
    echo json_encode(['success' => true, 'message' => 'Already logged in.']);
    exit;
}

// 4. ĐỌC DỮ LIỆU ĐƯỢC GỬI LÊN (Hỗ trợ cả JSON thô và Form thông thường)
$input = json_decode(file_get_contents('php://input'), true); // Đọc nội dung JSON gửi từ fetch() javascript và giải mã thành mảng
if (!$input) {
    $input = $_POST; // Nếu không phải JSON thô thì lấy dữ liệu từ Form gửi thông thường
}

$email    = trim($input['email']    ?? ''); // Lấy email người dùng nhập vào
$password = trim($input['password'] ?? ''); // Lấy mật khẩu người dùng nhập vào

// 5. KIỂM TRA DỮ LIỆU ĐẦU VÀO KHÔNG ĐƯỢC ĐỂ TRỐNG
if (empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Please enter both email and password.']);
    exit;
}

// 6. XỬ LÝ TRUY VẤN TÌM TÀI KHOẢN TRONG CSDL
$email_esc = mysqli_real_escape_string($conn, $email); // Làm sạch chuỗi email để ngăn chặn tấn công SQL Injection
$row = mysqli_fetch_assoc(
    mysqli_query($conn, "SELECT id, name, email, phone, role, password_hash
                         FROM USERS WHERE email = '$email_esc' LIMIT 1") // Chạy truy vấn SQL tìm user theo email
);

// 7. KIỂM TRA MẬT KHẨU BẰNG CƠ CHẾ BĂM BẢO MẬT (PASSWORD_VERIFY)
if ($row && password_verify($password, $row['password_hash'])) { // So sánh mật khẩu khách nhập với mã hash lưu trong CSDL
    // ĐĂNG NHẬP THÀNH CÔNG: Lưu thông tin tài khoản vào Session
    $_SESSION['user_id']    = $row['id'];
    $_SESSION['user_name']  = $row['name'];
    $_SESSION['user_email'] = $row['email'];
    $_SESSION['user_phone'] = $row['phone'];
    $_SESSION['user_role']  = $row['role'];

    echo json_encode(['success' => true, 'message' => 'Login successful.']); // Gửi phản hồi thành công về cho Javascript frontend
    exit;
} else {
    // ĐĂNG NHẬP THẤT BẠI: Trả về thông báo lỗi chung
    echo json_encode(['success' => false, 'message' => 'Invalid email or password. Please try again.']);
    exit;
}
