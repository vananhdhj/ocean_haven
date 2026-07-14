<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/db-connection.php';

$email = isset($_GET['email']) ? trim($_GET['email']) : '';

if (empty($email)) {
    echo json_encode([]);
    exit;
}

$email_esc = mysqli_real_escape_string($conn, $email);

$query = "SELECT b.id, b.booking_code, b.check_in, b.check_out, b.guest_count, 
                 b.total_price, b.status, b.create_at, r.name AS room_name
          FROM BOOKINGS b
          JOIN ROOMS r ON b.room_id = r.id
          WHERE b.guest_email = '$email_esc'
          ORDER BY b.create_at DESC";

$result = mysqli_query($conn, $query);
$bookings = [];

if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $bookings[] = [
            'id' => $row['id'],
            'booking_code' => $row['booking_code'],
            'room' => $row['room_name'],
            'check_in' => $row['check_in'],
            'check_out' => $row['check_out'],
            'guests' => (int)$row['guest_count'],
            'status' => $row['status'],
            'bookedOn' => $row['create_at'],
            'total' => (float)$row['total_price']
        ];
    }
}

echo json_encode($bookings);
exit;
