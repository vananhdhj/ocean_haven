<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../auth/session.php';
require_once __DIR__ . '/../config/db-connection.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthenticated']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$booking_id = isset($input['booking_id']) ? trim($input['booking_id']) : '';

if (empty($booking_id)) {
    echo json_encode(['success' => false, 'message' => 'Booking ID is required.']);
    exit;
}

$booking_id_esc  = mysqli_real_escape_string($conn, $booking_id);
$session_user_id = $_SESSION['user_id'];
$session_role    = $_SESSION['user_role'] ?? 'user';

// Find the booking by booking_code (the friendly ID shown in UI)
$find_query = "SELECT id, user_id, status FROM BOOKINGS
               WHERE id = '$booking_id_esc' OR booking_code = '$booking_id_esc'
               LIMIT 1";
$find_res = mysqli_query($conn, $find_query);
$booking  = mysqli_fetch_assoc($find_res);

if (!$booking) {
    echo json_encode(['success' => false, 'message' => 'Booking not found.']);
    exit;
}

// RBAC: only the owner OR an admin may cancel
if ($session_role !== 'admin' && $booking['user_id'] !== $session_user_id) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You are not authorised to cancel this booking.']);
    exit;
}

if ($booking['status'] === 'Cancelled') {
    echo json_encode(['success' => true, 'message' => 'Booking was already cancelled.']);
    exit;
}

$real_booking_id = $booking['id'];

$update_query = "UPDATE BOOKINGS SET status = 'Cancelled' WHERE id = '$real_booking_id'";
if (mysqli_query($conn, $update_query)) {
    $hist_id   = 'hist-' . bin2hex(random_bytes(8));
    $hist_note = mysqli_real_escape_string($conn, "Booking cancelled by " . ($session_role === 'admin' ? 'admin' : 'guest') . " request.");
    mysqli_query($conn, "INSERT INTO HISTORY_BOOKING (id, booking_id, action, note)
                         VALUES ('$hist_id', '$real_booking_id', 'CANCELLED', '$hist_note')");

    echo json_encode(['success' => true, 'message' => 'Booking cancelled successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . mysqli_error($conn)]);
}
exit;
