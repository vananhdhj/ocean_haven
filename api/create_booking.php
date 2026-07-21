<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../auth/session.php';
require_once __DIR__ . '/../config/db-connection.php';
// Gọi file cấu hình VNPay bằng __DIR__ để không bị set cứng
require_once __DIR__ . '/../config/vnpay-config.php';

// Must be logged in to create a booking
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please log in to make a booking.']);
    exit;
}

$session_user_id = $_SESSION['user_id'];

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
  $input = $_POST;
}

$room_id = isset($input['room_id']) ? mysqli_real_escape_string($conn, $input['room_id']) : null;
$check_in = isset($input['check_in']) ? mysqli_real_escape_string($conn, $input['check_in']) : null;
$check_out = isset($input['check_out']) ? mysqli_real_escape_string($conn, $input['check_out']) : null;
$guest_name = isset($input['guest_name']) ? mysqli_real_escape_string($conn, $input['guest_name']) : null;
$guest_email = isset($input['guest_email']) ? mysqli_real_escape_string($conn, $input['guest_email']) : null;
$guest_phone = isset($input['guest_phone']) ? mysqli_real_escape_string($conn, $input['guest_phone']) : null;
$special_requests = isset($input['special_requests']) ? mysqli_real_escape_string($conn, $input['special_requests']) : '';
$payment_method = isset($input['payment_method']) ? mysqli_real_escape_string($conn, $input['payment_method']) : 'VNPAY';

// 1. Basic required fields validation
if (!$room_id || !$check_in || !$check_out || !$guest_name || !$guest_email || !$guest_phone) {
  echo json_encode(['success' => false, 'message' => 'All booking details are required.']);
  exit;
}

// 2. Date validation
$today = date('Y-m-d');
if ($check_in < $today) {
  echo json_encode(['success' => false, 'message' => 'Check-in date cannot be in the past.']);
  exit;
}

if ($check_out <= $check_in) {
  echo json_encode(['success' => false, 'message' => 'Check-out date must be after check-in date.']);
  exit;
}

// 3. Room validation
$room_query = "SELECT * FROM ROOMS WHERE id = '$room_id' AND is_active = TRUE LIMIT 1";
$room_res = mysqli_query($conn, $room_query);
$room = mysqli_fetch_assoc($room_res);

if (!$room) {
  echo json_encode(['success' => false, 'message' => 'Selected room is invalid or currently inactive.']);
  exit;
}

// 4. Overlapping booking check
$overlap_query = "SELECT COUNT(*) AS booked_count FROM BOOKINGS 
                  WHERE room_id = '$room_id' 
                    AND status != 'Cancelled' 
                    AND check_in < '$check_out' 
                    AND check_out > '$check_in'";
$overlap_res = mysqli_query($conn, $overlap_query);
$overlap = mysqli_fetch_assoc($overlap_res);

if ($overlap && (int)$overlap['booked_count'] > 0) {
  echo json_encode(['success' => false, 'message' => 'Selected room is already booked for these dates.']);
  exit;
}

// 5. Price calculation
$check_in_date = new DateTime($check_in);
$check_out_date = new DateTime($check_out);
$interval = $check_in_date->diff($check_out_date);
$nights = (int)$interval->days;

if ($nights < 1) {
  echo json_encode(['success' => false, 'message' => 'Booking must be at least 1 night.']);
  exit;
}

$room_price = (float)$room['price'];
$subtotal = $room_price * $nights;
$tax = $subtotal * 0.10; // 10% tax
$total_price = $subtotal + $tax;

// 6. Generate UUIDs and Codes
$booking_id = 'bk-' . bin2hex(random_bytes(8));
$booking_code = 'OH-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(3)));

// TÍCH HỢP VNPAY
// 7. Insert Booking (Trạng thái Pending, Giữ chỗ 15 phút)
$status = 'Pending';
$hold_expires_at = date('Y-m-d H:i:s', strtotime('+15 minutes')); // Hết hạn sau 15p

$user_id_esc = mysqli_real_escape_string($conn, $session_user_id);

$insert_booking = "INSERT INTO BOOKINGS
                    (id, booking_code, user_id, room_id, check_in, check_out, guest_count,
                     guest_name, guest_email, guest_phone, special_requests, total_price, status, hold_expires_at)
                   VALUES
                    ('$booking_id', '$booking_code', '$user_id_esc', '$room_id', '$check_in', '$check_out', {$room['max_guests']},
                     '$guest_name', '$guest_email', '$guest_phone', '$special_requests', $total_price, '$status', '$hold_expires_at')";

if (!mysqli_query($conn, $insert_booking)) {
  echo json_encode(['success' => false, 'message' => 'Database error while saving booking: ' . mysqli_error($conn)]);
  exit;
}

// 8. Insert Payment (Trạng thái Pending)
$payment_id = 'pay-' . bin2hex(random_bytes(8));
$vnp_TxnRef = $booking_code . '_' . time(); // Mã đơn hàng duy nhất gửi lên VNPay - dùng làm vnp_TxnRef

$insert_payment = "INSERT INTO PAYMENTS 
                    (id, booking_id, payment_method, transaction_id, vnpay_order_id, amount, status, paid_at) 
                   VALUES 
                    ('$payment_id', '$booking_id', 'VNPAY', NULL, '$vnp_TxnRef', $total_price, 'Pending', NULL)";
mysqli_query($conn, $insert_payment);

// 9. Insert History Log (Chỉ log Created)
$history_id_1 = 'hist-' . bin2hex(random_bytes(8));
$insert_history_1 = "INSERT INTO HISTORY_BOOKING (id, booking_id, action, note) VALUES ('$history_id_1', '$booking_id', 'CREATED', 'Booking created, waiting for VNPAY payment')";
mysqli_query($conn, $insert_history_1);


// 10. BUILD URL THANH TOÁN VNPAY
// Khác MoMo (server-to-server): VNPay KHÔNG gọi API tạo giao dịch trước (không cURL),
// chỉ build query string kèm chữ ký rồi trả thẳng URL cho frontend redirect.
date_default_timezone_set('Asia/Ho_Chi_Minh');
 
$vnp_Amount   = (int) round($total_price) * 100; // VNPay tính theo đơn vị "xu"
$vnp_OrderInfo = "Thanh toan dat phong Ocean Haven: " . $booking_code;
$vnp_IpAddr   = $_SERVER['REMOTE_ADDR'];
$createDate   = date('YmdHis');
$expireDate   = date('YmdHis', strtotime('+15 minutes'));

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
  "vnp_TxnRef"     => $vnp_TxnRef,
  "vnp_ExpireDate" => $expireDate,
];

// Sắp xếp các tham số trong mảng theo thứ tự chữ cái từ A-Z (theo quy định của VNPAY)
ksort($inputData);
 
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
 
// Mã hóa hashData bằng thuật toán SHA512 với mã bí mật vnp_HashSecret
$vnpSecureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);
 
$payUrl = $vnp_Url . "?" . $query . "vnp_SecureHash=" . $vnpSecureHash;
 
// 11. Trả kết quả về Frontend
echo json_encode([
    'success'      => true,
    'booking_id'   => $booking_id,
    'booking_code' => $booking_code,
    'payUrl'       => $payUrl // Trả đường dẫn thanh toán VNPAY về cho JavaScript chuyển hướng
]);
exit;
