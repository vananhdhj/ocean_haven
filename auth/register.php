<?php
// 1. NHÚNG CÁC CÔNG CỤ CẦN THIẾT
require_once __DIR__ . '/session.php'; // Gọi file quản lý session đăng nhập
require_once __DIR__ . '/../config/db-connection.php'; // Gọi file kết nối CSDL (để insert dữ liệu mới)

header('Content-Type: application/json; charset=utf-8'); // Thiết lập định dạng trả về là JSON cho AJAX sử dụng

// 2. CHỈ NHẬN REQUEST PHƯƠNG THỨC POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

// 3. NẾU ĐÃ ĐĂNG NHẬP RỒI THÌ BÁO THÀNH CÔNG LUÔN
if (isLoggedIn()) {
    echo json_encode(['success' => true, 'message' => 'Already logged in.']);
    exit;
}

// 4. LẤY DỮ LIỆU ĐƯỢC KHÁCH GỬI LÊN (JSON HOẶC FORM POST)
$input = json_decode(file_get_contents('php://input'), true); // Giải mã dữ liệu JSON thô gửi từ client, với phiên bản hiện tại thì không cần thiết nhưng để đảm bảo tính tương thích thì vẫn để
if (!$input) {
    $input = $_POST; // Nếu không phải JSON thì lấy từ Form dữ liệu post thông thường
}

$name     = trim($input['name']     ?? ''); // Lấy họ tên
$email    = trim($input['email']    ?? ''); // Lấy email
$phone    = trim($input['phone']    ?? ''); // Lấy số điện thoại
$password = trim($input['password'] ?? ''); // Lấy mật khẩu
$confirm  = trim($input['confirm']  ?? ''); // Lấy mật khẩu xác nhận lại

// 5. VALIDATION: KIỂM TRA CÁC RÀNG BUỘC DỮ LIỆU ĐẦU VÀO
if (empty($name) || empty($email) || empty($phone) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) { // Sử dụng hàm filter mặc định để kiểm tra cấu trúc email
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email address.']);
    exit;
} elseif (strlen($password) < 6) { // Yêu cầu mật khẩu tối thiểu 6 ký tự để bảo mật
    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters.']);
    exit;
} elseif ($password !== $confirm) { // Bắt buộc hai ô mật khẩu phải nhập giống hệt nhau
    echo json_encode(['success' => false, 'message' => 'Passwords do not match.']);
    exit;
}

// 6. KIỂM TRA XEM EMAIL ĐÃ BỊ TRÙNG TRONG CSDL CHƯA
$email_esc = mysqli_real_escape_string($conn, $email); // Làm sạch dữ liệu để tránh SQL Injection
$existing = mysqli_fetch_assoc(
    mysqli_query($conn, "SELECT id FROM USERS WHERE email = '$email_esc' LIMIT 1") // Tìm xem có tài khoản nào dùng email này chưa
);

if ($existing) {
    echo json_encode(['success' => false, 'message' => 'An account with this email already exists.']); // Báo lỗi nếu trùng email
    exit;
} else {
    // 7. TIẾN HÀNH TẠO MỚI TÀI KHOẢN VÀ LƯU VÀO CSDL
    $user_id       = 'usr-' . bin2hex(random_bytes(8)); // Tạo ngẫu nhiên một mã ID duy nhất dài 16 ký tự cho User
    $password_hash = password_hash($password, PASSWORD_BCRYPT); // Mã hóa một chiều (băm bảo mật) mật khẩu bằng thuật toán BCRYPT
    $name_esc      = mysqli_real_escape_string($conn, $name); // Làm sạch tên
    $phone_esc     = mysqli_real_escape_string($conn, $phone); // Làm sạch số điện thoại
    $hash_esc      = mysqli_real_escape_string($conn, $password_hash); // Làm sạch chuỗi hash mật khẩu

    // Lệnh chèn thông tin tài khoản mới vào bảng USERS (Mặc định vai trò là 'user')
    $insert = "INSERT INTO USERS (id, name, email, role, password_hash, phone)
               VALUES ('$user_id', '$name_esc', '$email_esc', 'user', '$hash_esc', '$phone_esc')";

    if (mysqli_query($conn, $insert)) {
        // TỰ ĐỘNG ĐĂNG NHẬP SAU KHI ĐĂNG KÝ THÀNH CÔNG
        $_SESSION['user_id']    = $user_id;
        $_SESSION['user_name']  = $name;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_phone'] = $phone;
        $_SESSION['user_role']  = 'user';

        echo json_encode(['success' => true, 'message' => 'Registration successful.']); // Trả về kết quả thành công cho frontend
        exit;
    } else {
        echo json_encode(['success' => false, 'message' => 'Registration failed: ' . mysqli_error($conn)]);
        exit;
    }
}
