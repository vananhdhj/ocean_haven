<?php
// 1. KHỞI CHẠY PHIÊN LÀM VIỆC (SESSION)
if (session_status() === PHP_SESSION_NONE) { // Kiểm tra nếu hệ thống chưa bật Session
    session_start(); // Kích hoạt Session để lưu tạm thông tin đăng nhập của người dùng trên Server
}

// 2. HÀM BẮT BUỘC ĐĂNG NHẬP MỚI ĐƯỢC XEM TRANG
function requireLogin(): void {
    if (empty($_SESSION['user_id'])) { // Nếu chưa lưu ID người dùng trong session (chưa đăng nhập)
        header('Location: /ocean_haven/home.php'); // Chuyển hướng khách về trang chủ (nơi chứa popup đăng nhập)
        exit; // Dừng toàn bộ mã lệnh phía sau
    }
}

// 3. HÀM BẮT BUỘC TÀI KHOẢN ADMIN MỚI ĐƯỢC VÀO TRANG
function requireAdmin(): void {
    requireLogin(); // Đầu tiên là phải đăng nhập tài khoản trước
    if (($_SESSION['user_role'] ?? '') !== 'admin') { // Nếu vai trò lưu trong session không phải là admin
        http_response_code(403); // Gửi mã phản hồi lỗi 403 (Không có quyền truy cập)
        echo '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">
              <h2>403 — Forbidden</h2>
              <p>You do not have permission to access this page.</p>
              <a href="/ocean_haven/home.php">← Back to home</a>
              </body></html>'; // Hiển thị giao diện báo lỗi và link quay về trang chủ
        exit; // Dừng toàn bộ lệnh phía sau
    }
}

// 4. HÀM LẤY NHANH THÔNG TIN TÀI KHOẢN ĐANG ĐĂNG NHẬP
function currentUser(): ?array {
    if (empty($_SESSION['user_id'])) { // Nếu chưa đăng nhập
        return null; // Trả về giá trị trống
    }
    return [ // Trả về một mảng chứa thông tin cơ bản của người dùng đang đăng nhập
        'id'    => $_SESSION['user_id'],
        'name'  => $_SESSION['user_name']  ?? '',
        'email' => $_SESSION['user_email'] ?? '',
        'role'  => $_SESSION['user_role']  ?? 'user',
        'phone' => $_SESSION['user_phone'] ?? '',
    ];
}

// 5. HÀM KIỂM TRA NHANH XEM CÓ PHẢI LÀ ADMIN KHÔNG (Trả về true/false)
function isAdmin(): bool {
    return ($_SESSION['user_role'] ?? '') === 'admin'; // So sánh và trả về kết quả đúng/sai trực tiếp
}

// 6. HÀM KIỂM TRA NHANH XEM ĐÃ ĐĂNG NHẬP CHƯA (Trả về true/false)
function isLoggedIn(): bool {
    return !empty($_SESSION['user_id']); // Nếu session 'user_id' không trống nghĩa là đã đăng nhập thành công
}
