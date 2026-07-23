<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../auth/session.php';
require_once __DIR__ . '/../config/db-connection.php';

// Must be admin
if (!isLoggedIn() || currentUser()['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['booking_id']) || !isset($input['status'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

$booking_id = mysqli_real_escape_string($conn, $input['booking_id']);
$new_status = mysqli_real_escape_string($conn, $input['status']);

// Update booking status
$updateSql = "UPDATE BOOKINGS SET status = '$new_status' WHERE id = '$booking_id'";
if (mysqli_query($conn, $updateSql)) {
    // Log history
    $adminName = mysqli_real_escape_string($conn, currentUser()['name']);
    $note = "Admin $adminName marked booking as $new_status";
    $logId = bin2hex(random_bytes(16));
    mysqli_query($conn, "INSERT INTO HISTORY_BOOKING (id, booking_id, action, note) 
                         VALUES ('$logId', '$booking_id', 'STATUS_UPDATED', '$note')");
    
    echo json_encode(['success' => true, 'message' => 'Booking status updated successfully']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update booking status: ' . mysqli_error($conn)]);
}
