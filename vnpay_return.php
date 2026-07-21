<?php
require_once __DIR__ . '/auth/session.php';
require_once __DIR__ . '/config/db-connection.php';
require_once __DIR__ . '/config/vnpay-config.php';

// ---------- 1. Nhận dữ liệu từ VNPAY gửi về qua URL ----------
$inputData = array();
foreach ($_GET as $key => $value) {
    if (substr($key, 0, 4) == "vnp_") {
        $inputData[$key] = $value;
    }
}

// ---------- 2. Xác thực tính toàn vẹn của chữ ký số VNPAY ----------
$vnp_SecureHash = $_GET['vnp_SecureHash'] ?? ''; // Chữ ký số do VNPAY cấp
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

$sigValid  = ($secureHash === $vnp_SecureHash);
$isSuccess = ($sigValid && isset($_GET['vnp_ResponseCode']) && $_GET['vnp_ResponseCode'] == '00');

// ---------- 3. Truy xuất thông tin Booking từ Cơ sở dữ liệu ----------
$booking = null;
$orderId = $_GET['vnp_TxnRef'] ?? ''; // vnp_TxnRef response

if ($orderId) {
    $orderId_esc = mysqli_real_escape_string($conn, $orderId);

    $payRes = mysqli_query($conn,
        "SELECT p.*, b.booking_code, b.check_in, b.check_out, b.guest_name,
                b.guest_email, b.guest_phone, b.total_price, b.status AS booking_status,
                r.name AS room_name, r.price AS room_price
         FROM PAYMENTS p
         JOIN BOOKINGS b ON p.booking_id = b.id
         JOIN ROOMS    r ON b.room_id    = r.id
         WHERE p.vnpay_order_id = '$orderId_esc' 
         LIMIT 1"
    );
    if ($payRes) {
        $booking = mysqli_fetch_assoc($payRes);
    }
}

// Cập nhật trạng thái trong Cơ sở dữ liệu khi chữ ký hợp lệ
if ($sigValid && $booking) {
    $vnp_TransactionNo = mysqli_real_escape_string($conn, $_GET['vnp_TransactionNo'] ?? '');
    $bookingId_esc = mysqli_real_escape_string($conn, $booking['booking_id']);

    if ($isSuccess) {
        if ($booking['booking_status'] === 'Pending') {
            mysqli_query($conn, "UPDATE BOOKINGS SET status = 'Confirmed' WHERE id = '$bookingId_esc'");
            mysqli_query($conn, "UPDATE PAYMENTS SET status = 'Completed', transaction_id = '$vnp_TransactionNo' WHERE vnpay_order_id = '$orderId_esc'");
            $booking['booking_status'] = 'Confirmed';
        }
    } else {
        if ($booking['booking_status'] === 'Pending') {
            mysqli_query($conn, "UPDATE BOOKINGS SET status = 'Cancelled' WHERE id = '$bookingId_esc'");
            mysqli_query($conn, "UPDATE PAYMENTS SET status = 'Failed' WHERE vnpay_order_id = '$orderId_esc'");
            $booking['booking_status'] = 'Cancelled';
        }
    }
}

$vnp_Amount     = isset($_GET['vnp_Amount']) ? ($_GET['vnp_Amount'] / 100) : 0; // VNPAY trả về số tiền nhân 100
// Định dạng tiền tệ hiển thị VNĐ trực quan
$amountNum = (int)($booking['total_price'] ?? $vnp_Amount);
$amountVnd = number_format($amountNum, 0, ',', '.');

$pageTitle = $isSuccess ? "Booking Confirmed — Ocean Haven Hotel" : "Payment Failed — Ocean Haven Hotel";
?>
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title><?php echo $pageTitle; ?></title>
        <link rel="stylesheet" href="assets/css/global.css">
        <link rel="stylesheet" href="assets/css/components/modals.css">
    </head>
    <body>
        <div class="container">
            <div class="table-responsive margin-t-b flex-col">
                <div class="header">
                    <h3 class="text-3xl margin-t-b">VNPAY RESPONSE</h3>
                </div>
                
                <div class="response-info">
                    <div class="alert <?php echo $isSuccess ? 'alert-success' : 'alert-danger'; ?>" role="alert">
                        <h4>
                            <?php
                            if ($sigValid) {
                                if ($isSuccess) {
                                    echo "Giao dịch thành công!";
                                } else {
                                    echo "Giao dịch thất bại / Có lỗi xảy ra.";
                                }
                            } else {
                                echo "Chữ ký không hợp lệ (Dữ liệu bị can thiệp)!";
                            }
                            ?>
                        </h4>
                        <hr><br>
                    </div>
    
                    <!-- Khối hiển thị thông tin hóa đơn chi tiết khách hàng -->
                    <?php if ($booking): ?>
                        <div class="panel panel-default">
                            <div class="panel-heading"><b>Thông tin đặt phòng (<?php echo htmlspecialchars($booking['booking_code'] ?? ''); ?>)</b></div>
                            <div class="panel-body">
                                <p><b>Khách hàng:</b> <?php echo htmlspecialchars($booking['guest_name'] ?? ''); ?></p>
                                <p><b>Phòng:</b> <?php echo htmlspecialchars($booking['room_name'] ?? ''); ?></p>
                                <p><b>Thời gian:</b> <?php echo htmlspecialchars($booking['check_in'] ?? ''); ?> đến <?php echo htmlspecialchars($booking['check_out'] ?? ''); ?></p>
                            </div>
                        </div>
                    <?php endif; ?>
    
                    <div class="form-group">
                        <label>Mã đơn hàng:</label>
                        <label><?php echo htmlspecialchars($orderId); ?></label>
                    </div>    
                    <div class="form-group">
                        <label>Số tiền:</label>
                        <label><?php echo $amountVnd; ?> VNĐ</label>
                    </div>  
                    <div class="form-group">
                        <label>Nội dung thanh toán:</label>
                        <label><?php echo htmlspecialchars($_GET['vnp_OrderInfo'] ?? ''); ?></label>
                    </div> 
                    <div class="form-group">
                        <label>Mã phản hồi (vnp_ResponseCode):</label>
                        <label><?php echo htmlspecialchars($_GET['vnp_ResponseCode'] ?? ''); ?></label>
                    </div> 
                    <div class="form-group">
                        <label>Mã GD Tại VNPAY:</label>
                        <label><?php echo htmlspecialchars($_GET['vnp_TransactionNo'] ?? ''); ?></label>
                    </div> 
                    <div class="form-group">
                        <label>Mã Ngân hàng:</label>
                        <label><?php echo htmlspecialchars($_GET['vnp_BankCode'] ?? ''); ?></label>
                    </div> 
                    <div class="form-group">
                        <label>Thời gian thanh toán:</label>
                        <label><?php echo htmlspecialchars($_GET['vnp_PayDate'] ?? ''); ?></label>
                    </div> 
                </div>
                <br>
                <a href="home.php">
                    <button class="btn-block btn-primary">return to home page</button>
                </a>
                <br>
            </div>

            <footer class="footer">
                   <p>&copy; Ocean Haven Hotel <?php echo date('Y')?></p>
            </footer>
        </div>  
    </body>
</html>