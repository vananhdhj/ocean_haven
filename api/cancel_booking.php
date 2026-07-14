<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/db-connection.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$booking_id = isset($input['booking_id']) ? trim($input['booking_id']) : '';

if (empty($booking_id)) {
    echo json_encode(['success' => false, 'message' => 'Booking ID is required.']);
    exit;
}

$booking_id_esc = mysqli_real_escape_string($conn, $booking_id);

// Find the booking by ID or Code to get the real DB ID
$find_query = "SELECT id, status FROM BOOKINGS WHERE id = '$booking_id_esc' OR booking_code = '$booking_id_esc' LIMIT 1";
$find_res = mysqli_query($conn, $find_query);
$booking = mysqli_fetch_assoc($find_res);

if (!$booking) {
    echo json_encode(['success' => false, 'message' => 'Booking not found.']);
    exit;
}

if ($booking['status'] === 'Cancelled') {
    echo json_encode(['success' => true, 'message' => 'Booking was already cancelled.']);
    exit;
}

$real_booking_id = $booking['id'];

// Update the booking status
$update_query = "UPDATE BOOKINGS SET status = 'Cancelled' WHERE id = '$real_booking_id'";
if (mysqli_query($conn, $update_query)) {
    // Insert into history log
    $hist_id = 'hist-' . bin2hex(random_bytes(8));
    $hist_note = mysqli_real_escape_string($conn, "Booking cancelled by guest request.");
    $insert_history = "INSERT INTO HISTORY_BOOKING (id, booking_id, action, note) 
                       VALUES ('$hist_id', '$real_booking_id', 'CANCELLED', '$hist_note')";
    mysqli_query($conn, $insert_history);

    echo json_encode(['success' => true, 'message' => 'Booking cancelled successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error during cancellation: ' . mysqli_error($conn)]);
}
exit;
