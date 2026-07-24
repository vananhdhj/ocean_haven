<?php
// 1. NHÚNG CÔNG CỤ QUẢN LÝ PHIÊN LÀM VIỆC
require_once __DIR__ . '/session.php'; // Đảm bảo gọi session_start() để có thể can thiệp huỷ session

// 2. HUỶ TOÀN BỘ DỮ LIỆU PHIÊN LÀM VIỆC TRÊN SERVER
session_destroy(); // Xoá sạch mọi biến lưu trong $_SESSION (user_id, user_role...) trên bộ nhớ máy chủ

// 3. XOÁ COOKIE PHIÊN LÀM VIỆC Ở TRÌNH DUYỆT NGƯỜI DÙNG (Để bảo mật tối đa)
if (ini_get("session.use_cookies")) { // Kiểm tra nếu session có tạo cookie lưu trữ trên trình duyệt của khách
    $params = session_get_cookie_params(); // Lấy cấu hình các tham số cookie hiện tại (domain, path, secure...)
    setcookie(
        session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    ); // Đặt thời gian hết hạn cookie về quá khứ để trình duyệt tự động xoá nó ngay lập tức
}

// 4. CHUYỂN HƯỚNG NGƯỜI DÙNG QUAY VỀ TRANG CHỦ
header('Location: /ocean_haven/home.php'); // Gửi lệnh chuyển hướng người dùng về trang chủ
exit; // Dừng toàn bộ lệnh phía sau
