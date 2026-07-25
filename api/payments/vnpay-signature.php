<?php
// 1. NHÚNG FILE CẤU HÌNH VNPAY ĐỂ LẤY KHÓA BẢO MẬT & URL CỔNG THANH TOÁN
require_once __DIR__ . '/../../config/vnpay-config.php';

// 2. HÀM TỰ ĐỘNG XÂY DỰNG URL THANH TOÁN SANG VNPAY (CÓ CHỮ KÝ BẢO MẬT HMAC-SHA512)
function buildVnpayUrl($total_price, $booking_code, $vnp_TxnRef) {
    // Gọi các biến cấu hình toàn cục từ file vnpay-config.php vào sử dụng
    global $vnp_TmnCode, $vnp_HashSecret, $vnp_Url, $vnp_ReturnUrl;

    date_default_timezone_set('Asia/Ho_Chi_Minh');
    
    // VNPay quy định số tiền gửi sang phải nhân lên 100 lần (đơn vị xu)
    $vnp_Amount   = (int) round($total_price) * 100; 
    $vnp_OrderInfo = "Thanh toan dat phong Ocean Haven: " . $booking_code; // Nội dung chuyển khoản
    $vnp_IpAddr   = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'; // Lấy IP người dùng gửi yêu cầu
    $createDate   = date('YmdHis'); // Thời điểm tạo
    $expireDate   = date('YmdHis', strtotime('+15 minutes')); // Hết hạn thanh toán sau 15 phút

    // Mảng chứa toàn bộ dữ liệu cấu hình để gửi sang VNPay
    $inputData = [
        "vnp_Version"    => "2.1.0",
        "vnp_TmnCode"    => $vnp_TmnCode,
        "vnp_Amount"     => $vnp_Amount,
        "vnp_Command"    => "pay",
        "vnp_CreateDate" => $createDate,
        "vnp_CurrCode"   => "VND",
        "vnp_IpAddr"     => $vnp_IpAddr,
        "vnp_Locale"     => "vn",
        "vnp_OrderInfo"  => $vnp_OrderInfo,
        "vnp_OrderType"  => "other",
        "vnp_ReturnUrl"  => $vnp_ReturnUrl,
        "vnp_TxnRef"     => $vnp_TxnRef, // Mã đơn hàng duy nhất của web để VNPay gửi lại khi đối soát
        "vnp_ExpireDate" => $expireDate,
    ];

    // Sắp xếp các tham số theo thứ tự A-Z (Bắt buộc theo thuật toán mã hóa của VNPAY)
    ksort($inputData);
    
    // Nối mảng tham số thành 1 chuỗi ký tự dài để tạo chữ ký
    $query = "";
    $hashData = "";
    $i = 0;
    foreach ($inputData as $key => $value) {
        if ($i == 1) {
            $hashData .= '&' . urlencode($key) . "=" . urlencode($value);
        } else {
            $hashData .= urlencode($key) . "=" . urlencode($value);
            $i = 1;
        }
        $query .= urlencode($key) . "=" . urlencode($value) . '&';
    }
    
    // Tạo chữ ký điện tử HMAC-SHA512 bằng chuỗi tham số đã băm và Mã khóa bí mật
    $vnpSecureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);
    
    // Trả về URL hoàn chỉnh kèm chữ ký để client tự động redirect sang trang thanh toán VNPAY
    return $vnp_Url . "?" . $query . "vnp_SecureHash=" . $vnpSecureHash;
}
