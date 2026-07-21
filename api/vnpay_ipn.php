<?php

require_once __DIR__ . '/../config/db-connection.php';
require_once __DIR__ . '/../config/vnpay-config.php';

$inputData = array();  // chứa lưu dữ liệu được gửi từ VNPAY về hệ thống
$returnData = array();  // chứa phản hồi
// Duyệt qua tất cả các dữ liệu gửi qua phương thức GET từ URL
foreach ($_GET as $key => $value) {
    // Nếu tên tham số bắt đầu bằng chữ "vnp_" thì thêm vào mảng inputData
    if (substr($key, 0, 4) == "vnp_") {
        $inputData[$key] = $value;
    }
}

$vnp_SecureHash = $inputData['vnp_SecureHash']; // Chữ ký số do VNPAY cấp
unset($inputData['vnp_SecureHash']); // Xóa chữ ký này ra khỏi mảng dữ liệu đầu vào để chuẩn bị hash lại
unset($inputData['vnp_SecureHashType']);
ksort($inputData); // Sắp xếp các tham số trong mảng theo thứ tự chữ cái từ A-Z (theo quy định của VNPAY)
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

// Mã hóa hashData bằng thuật toán SHA512 với mã bí mật vnp_HashSecret
$secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

$vnpTranId = $inputData['vnp_TransactionNo']; //Mã giao dịch tại VNPAY
$vnp_BankCode = $inputData['vnp_BankCode']; //Ngân hàng thanh toán
$vnp_Amount = $inputData['vnp_Amount'] / 100; // Số tiền thanh toán VNPAY phản hồi

$Status = 0; // 0 (Chưa thanh toán)
$orderId = $inputData['vnp_TxnRef'];

try {
    //Check Orderid    
    // Kiểm tra Checksum xem dữ liệu có bị chỉnh sửa trên đường truyền không
    if ($secureHash == $vnp_SecureHash) {
        //Lấy thông tin đơn hàng lưu trong Database và kiểm tra trạng thái của đơn hàng, mã đơn hàng là: $orderId            
        //Việc kiểm tra trạng thái của đơn hàng giúp hệ thống không xử lý trùng lặp, xử lý nhiều lần một giao dịch
        $sql = "SELECT * FROM PAYMENTS WHERE `vnpay_order_id` = '" . mysqli_real_escape_string($conn, $orderId) . "' LIMIT 1";
        $result = mysqli_query($conn, $sql);
        $order = mysqli_fetch_assoc($result);   
        // Kiểm tra sự tồn tại của đơn hàng
        if ($order != NULL) {
            if ($order["amount"] == $vnp_Amount) //Kiểm tra số tiền thanh toán của giao dịch
            {
                // Chưa thanh toán thì mới xử lý tiếp
                if ($order["status"] != NULL && $order["status"] == 'Pending') {
                    $vnp_TransactionNo = mysqli_real_escape_string($conn, $inputData['vnp_TransactionNo']);
                    $current_time = date('Y-m-d H:i:s');

                    if ($inputData['vnp_ResponseCode'] == '00' && $inputData['vnp_TransactionStatus'] == '00') {
                        $Status = 'Completed'; // Trạng thái thanh toán thành công
                        $updateBookingSql = "UPDATE BOOKINGS SET status = 'Confirmed' WHERE id = '" . mysqli_real_escape_string($conn, $order['booking_id']) . "'";
                    } else {
                        $Status = 'Failed'; // Trạng thái thanh toán thất bại / lỗi
                        $updateBookingSql = "UPDATE BOOKINGS SET status = 'Cancelled' WHERE id = '" . mysqli_real_escape_string($conn, $order['booking_id']) . "'";
                    }
                    $updatePaymentSql = "UPDATE PAYMENTS SET status = '$Status', transaction_id = '$vnp_TransactionNo' WHERE id = '" . mysqli_real_escape_string($conn, $order['id']) . "'";

                    mysqli_query($conn, $updateBookingSql);
                    mysqli_query($conn, $updatePaymentSql);                
                    //Trả kết quả về cho VNPAY: Website/APP TMĐT ghi nhận yêu cầu thành công                
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
//Trả lại VNPAY theo định dạng JSON
echo json_encode($returnData);
