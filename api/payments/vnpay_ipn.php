<?php
// 1. NHÚNG CÁC THƯ VIỆN HỆ THỐNG LIÊN KẾT
require_once __DIR__ . '/../../config/db-connection.php'; // Kết nối cơ sở dữ liệu
require_once __DIR__ . '/../../config/vnpay-config.php'; // File cấu hình mã khoá bảo mật của VNPay

$inputData = array();  // Mảng chứa các tham số VNPay gửi ngầm về
$returnData = array(); // Mảng chứa kết quả phản hồi lại cho máy chủ VNPay biết

// 2. THU THẬP CÁC THAM SỐ TRONG ĐƯỜNG DẪN MÀ VNPAY TRẢ VỀ (GET REQUEST)
foreach ($_GET as $key => $value) {
    if (substr($key, 0, 4) == "vnp_") {
        $inputData[$key] = $value;
    }
}

// 3. XỬ LÝ CHỮ KÝ ĐỂ KIỂM TRA BẢO MẬT (CHỐNG CAN THIỆP/SỬA ĐỔI DỮ LIỆU)
$vnp_SecureHash = $inputData['vnp_SecureHash'];
unset($inputData['vnp_SecureHash']); // Tách chữ ký ra để mã hóa lại các tham số còn lại
unset($inputData['vnp_SecureHashType']);
ksort($inputData); // Sắp xếp theo bảng chữ cái từ A-Z

// Nối chuỗi tham số
$i = 0;
$hashData = "";
foreach ($inputData as $key => $value) {
    if ($i == 1) {
        $hashData = $hashData . '&' . urlencode($key) . "=" . urlencode($value);
    } else {
        $hashData = $hashData . urlencode($key) . "=" . urlencode($value);
        $i = 1;
    }
}

// Tự mã hóa lại chuỗi dữ liệu bằng SHA512 kết hợp khoá bí mật
$secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

$vnp_Amount = $inputData['vnp_Amount'] / 100; // Chia lại 100 để lấy số tiền thực tế (VND)
$orderId = $inputData['vnp_TxnRef']; // Mã tham chiếu hoá đơn gửi sang VNPAY từ trước

try {
    // 4. BƯỚC ĐỐI CHIẾU CHỮ KÝ (CHECKSUM)
    if ($secureHash == $vnp_SecureHash) {
        // Truy vấn CSDL để đối chiếu hoá đơn thanh toán
        $sql = "SELECT * FROM PAYMENTS WHERE `vnpay_order_id` = '" . mysqli_real_escape_string($conn, $orderId) . "' LIMIT 1";
        $result = mysqli_query($conn, $sql);
        $order = mysqli_fetch_assoc($result);   
        
        // A. Kiểm tra sự tồn tại của đơn hàng trong hệ thống
        if ($order != NULL) {
            // B. Kiểm tra số tiền trả về từ VNPAY có khớp với hoá đơn gốc không
            if ($order["amount"] == $vnp_Amount) 
            {
                // C. Chỉ xử lý khi đơn hàng đang ở trạng thái 'Pending' (Chờ thanh toán) để tránh xử lý lặp nhiều lần
                if ($order["status"] != NULL && $order["status"] == 'Pending') {
                    $vnp_TransactionNo = mysqli_real_escape_string($conn, $inputData['vnp_TransactionNo']);

                    // Kiểm tra phản hồi từ ngân hàng: 00 nghĩa là giao dịch trừ tiền thành công
                    if ($inputData['vnp_ResponseCode'] == '00' && $inputData['vnp_TransactionStatus'] == '00') {
                        $Status = 'Completed'; // Trạng thái thanh toán hoàn tất
                        // Cập nhật trạng thái Đơn đặt phòng thành Confirmed (Đã xác nhận phòng)
                        $updateBookingSql = "UPDATE BOOKINGS SET status = 'Confirmed' WHERE id = '" . mysqli_real_escape_string($conn, $order['booking_id']) . "'";
                    } else {
                        $Status = 'Failed'; // Trạng thái thanh toán thất bại
                        // Cập nhật trạng thái Đơn đặt phòng thành Cancelled (Đã bị hủy lịch)
                        $updateBookingSql = "UPDATE BOOKINGS SET status = 'Cancelled' WHERE id = '" . mysqli_real_escape_string($conn, $order['booking_id']) . "'";
                    }
                    
                    // Cập nhật trạng thái bảng thanh toán PAYMENTS và lưu mã hoá đơn VNPAY cấp
                    $updatePaymentSql = "UPDATE PAYMENTS SET status = '$Status', transaction_id = '$vnp_TransactionNo' WHERE id = '" . mysqli_real_escape_string($conn, $order['id']) . "'";

                    // Thực thi hai câu lệnh SQL cập nhật CSDL
                    mysqli_query($conn, $updateBookingSql);
                    mysqli_query($conn, $updatePaymentSql);                
                                     
                    // Phản hồi thành công về cho hệ thống VNPAY biết để ngắt luồng gọi IPN Webhook
                    $returnData['RspCode'] = '00';
                    $returnData['Message'] = 'Confirm Success';
                } else {
                    $returnData['RspCode'] = '02';
                    $returnData['Message'] = 'Order already confirmed';
                }
            } else {
                $returnData['RspCode'] = '04';
                $returnData['Message'] = 'invalid amount';
            }
        } else {
            $returnData['RspCode'] = '01';
            $returnData['Message'] = 'Order not found';
        }
    } else {
        $returnData['RspCode'] = '97';
        $returnData['Message'] = 'Invalid signature';
    }
} catch (Exception $e) {
    $returnData['RspCode'] = '99';
    $returnData['Message'] = 'Unknow error';
}

// 5. XUẤT PHẢN HỒI KẾT QUẢ DẠNG JSON GỬI VỀ CHO MÁY CHỦ VNPAY
echo json_encode($returnData);
