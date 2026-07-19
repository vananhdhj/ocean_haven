<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../auth/session.php';
require_once __DIR__ . '/../config/db-connection.php';

// Must be logged in to fetch bookings
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthenticated']);
    exit;
}

$session_user_id = $_SESSION['user_id'];
$session_role    = $_SESSION['user_role'] ?? 'user';

// Admins may pass ?user_id= to view another user's bookings
if ($session_role === 'admin' && !empty($_GET['user_id'])) {
    $target_id = trim($_GET['user_id']);
} else {
    $target_id = $session_user_id;
}

$id_esc = mysqli_real_escape_string($conn, $target_id);

$query = "SELECT b.id, b.booking_code, b.check_in, b.check_out, b.guest_count,
                 b.total_price, b.status, b.create_at, r.name AS room_name
          FROM BOOKINGS b
          JOIN ROOMS r ON b.room_id = r.id
          WHERE b.user_id = '$id_esc'
          ORDER BY b.create_at DESC";

$result   = mysqli_query($conn, $query);
$bookings = [];

if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $bookings[] = [
            'id'           => $row['id'],
            'booking_code' => $row['booking_code'],
            'room'         => $row['room_name'],
            'check_in'     => $row['check_in'],
            'check_out'    => $row['check_out'],
            'guests'       => (int)$row['guest_count'],
            'status'       => $row['status'],
            'bookedOn'     => $row['create_at'],
            'total'        => (float)$row['total_price'],
        ];
    }
}

echo json_encode($bookings);
exit;
