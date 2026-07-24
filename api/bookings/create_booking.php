<?php
// 1. CẤU HÌNH PHẢN HỒI JSON CHO AJAX FRONTEND
header('Content-Type: application/json; charset=utf-8');

// 2. NHÚNG CÁC PHẦN MỀM THƯ VIỆN HỆ THỐNG
require_once __DIR__ . '/../../auth/session.php'; // Kiểm tra session đăng nhập
require_once __DIR__ . '/../../config/db-connection.php'; // Kết nối cơ sở dữ liệu
require_once __DIR__ . '/booking-validation.php'; // File kiểm tra tính hợp lệ dữ liệu
require_once __DIR__ . '/booking-data.php'; // File xử lý lưu CSDL bằng Transaction
require_once __DIR__ . '/../payments/vnpay-signature.php'; // File tạo link mã hoá VNPAY

// 3. BẮT BUỘC NGƯỜI DÙNG PHẢI ĐĂNG NHẬP
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please log in to make a booking.']);
    exit;
}

// 4. LẤY DỮ LIỆU ĐĂNG KÝ PHÒNG GỬI LÊN (JSON HOẶC FORM)
$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

// 5. BƯỚC 1: KIỂM TRA ĐẦU VÀO VÀ TÍNH TOÁN GIÁ TIỀN
$validationResult = validateBookingInput($conn, $input);
if (!$validationResult['success']) {
    echo json_encode(['success' => false, 'message' => $validationResult['message']]);
    exit;
}
$validData = $validationResult['data']; // Lấy mảng thông tin hợp lệ đã tính giá và VAT

// 6. BƯỚC 2: CHÈN THÔNG TIN ĐƠN ĐẶT PHÒNG VÀO DATABASE (CÓ CHỐNG TRÙNG LỊCH BẰNG TRIGGER DATABASE)
$insertResult = createBookingRecord($conn, $_SESSION['user_id'], $validData);
if (!$insertResult['success']) {
    echo json_encode(['success' => false, 'message' => $insertResult['message']]);
    exit;
}

// 7. BƯỚC 3: TẠO ĐƯỜNG DẪN THANH TOÁN (URL) CỦA VNPAY GỬI VỀ CHO KHÁCH HÀNG
$payUrl = buildVnpayUrl($validData['total_price'], $insertResult['booking_code'], $insertResult['vnp_TxnRef']);

// 8. TRẢ KẾT QUẢ CHO JAVASCRIPT FRONTEND ĐỂ CHUYỂN HƯỚNG SANG CỔNG THANH TOÁN VNPAY
echo json_encode([
    'success'      => true,
    'booking_id'   => $insertResult['booking_id'],
    'booking_code' => $insertResult['booking_code'],
    'payUrl'       => $payUrl // Trả đường dẫn thanh toán để frontend tự động chuyển trang
]);
exit;
