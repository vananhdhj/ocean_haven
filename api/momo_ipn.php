<?php
// MoMo gọi endpoint này (server-to-server) sau khi khách thanh toán xong.
// KHÔNG được redirect, KHÔNG output HTML - chỉ trả HTTP 200 + JSON nhỏ.

// Bắt buộc: log lỗi PHP ra file, không hiển thị ra response
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../config/db-connection.php';
$momoConfig = require_once __DIR__ . '/../config/momo-config.php';

// ---------- 1. Đọc payload từ MoMo ----------
$rawBody = file_get_contents('php://input');
$ipnData = json_decode($rawBody, true);

// Helper: trả response JSON và thoát
function respond(int $httpCode, string $message): void {
    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo json_encode(['message' => $message]);
    exit;
}

if (!$ipnData) {
    respond(400, 'Invalid JSON payload');
}

// ---------- 2. Xác thực chữ ký HMAC-SHA256 ----------
// Chuỗi raw để verify phải khớp chính xác với docs của MoMo
$accessKey    = $ipnData['accessKey']    ?? '';
$amount       = $ipnData['amount']       ?? '';
$extraData    = $ipnData['extraData']    ?? '';
$message      = $ipnData['message']      ?? '';
$orderId      = $ipnData['orderId']      ?? '';
$orderInfo    = $ipnData['orderInfo']    ?? '';
$orderType    = $ipnData['orderType']    ?? '';
$partnerCode  = $ipnData['partnerCode']  ?? '';
$payType      = $ipnData['payType']      ?? '';
$requestId    = $ipnData['requestId']    ?? '';
$responseTime = $ipnData['responseTime'] ?? '';
$resultCode   = isset($ipnData['resultCode']) ? (int)$ipnData['resultCode'] : -1;
$transId      = $ipnData['transId']      ?? '';
$receivedSig  = $ipnData['signature']    ?? '';

$rawHash = "accessKey=$accessKey"
         . "&amount=$amount"
         . "&extraData=$extraData"
         . "&message=$message"
         . "&orderId=$orderId"
         . "&orderInfo=$orderInfo"
         . "&orderType=$orderType"
         . "&partnerCode=$partnerCode"
         . "&payType=$payType"
         . "&requestId=$requestId"
         . "&responseTime=$responseTime"
         . "&resultCode=$resultCode"
         . "&transId=$transId";

$expectedSig = hash_hmac('sha256', $rawHash, $momoConfig['secretKey']);

if (!hash_equals($expectedSig, $receivedSig)) {
    respond(400, 'Invalid signature');
}

// ---------- 3. Tìm bản ghi payment theo momo_order_id ----------
$orderId_esc = mysqli_real_escape_string($conn, $orderId);

$paymentQuery = "SELECT p.id AS payment_id, p.booking_id, p.status AS pay_status
                 FROM PAYMENTS p
                 WHERE p.momo_order_id = '$orderId_esc'
                 LIMIT 1";
$payRes  = mysqli_query($conn, $paymentQuery);
$payment = mysqli_fetch_assoc($payRes);

if (!$payment) {
    // Không tìm thấy -> vẫn trả 200 để MoMo không retry mãi
    respond(200, 'Order not found – ignored');
}

$payment_id = $payment['payment_id'];
$booking_id = $payment['booking_id'];

// ---------- 4. Tránh xử lý trùng lặp (idempotent) ----------
if ($payment['pay_status'] !== 'Pending') {
    respond(200, 'Already processed');
}

// ---------- 5. Cập nhật DB theo kết quả ----------
if ($resultCode === 0) {
    // ✅ Thanh toán thành công
    $transId_esc = mysqli_real_escape_string($conn, (string)$transId);

    mysqli_query($conn, "UPDATE PAYMENTS
                          SET status = 'Completed',
                              transaction_id = '$transId_esc',
                              paid_at = NOW()
                          WHERE id = '$payment_id'");

    mysqli_query($conn, "UPDATE BOOKINGS
                          SET status = 'Confirmed',
                              hold_expires_at = NULL
                          WHERE id = '$booking_id'");

    $hist_id  = 'hist-' . bin2hex(random_bytes(8));
    $hist_note = mysqli_real_escape_string($conn, "MoMo IPN: payment confirmed. transId=$transId, amount=$amount");
    mysqli_query($conn, "INSERT INTO HISTORY_BOOKING (id, booking_id, action, note)
                          VALUES ('$hist_id', '$booking_id', 'PAYMENT_CONFIRMED', '$hist_note')");

} else {
    // ❌ Thanh toán thất bại / bị huỷ
    $msg_esc = mysqli_real_escape_string($conn, "MoMo IPN: payment failed. resultCode=$resultCode, message=$message");

    mysqli_query($conn, "UPDATE PAYMENTS
                          SET status = 'Failed'
                          WHERE id = '$payment_id'");

    mysqli_query($conn, "UPDATE BOOKINGS
                          SET status = 'Cancelled'
                          WHERE id = '$booking_id'");

    $hist_id = 'hist-' . bin2hex(random_bytes(8));
    mysqli_query($conn, "INSERT INTO HISTORY_BOOKING (id, booking_id, action, note)
                          VALUES ('$hist_id', '$booking_id', 'PAYMENT_FAILED', '$msg_esc')");
}

// ---------- 6. Luôn trả HTTP 200 cho MoMo ----------
respond(200, 'IPN received');
