<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../auth/session.php';
require_once __DIR__ . '/../config/db-connection.php';

// Must be logged in
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthenticated']);
    exit;
}

$user_id = $_SESSION['user_id'];
$id_esc  = mysqli_real_escape_string($conn, $user_id);

$row = mysqli_fetch_assoc(
    mysqli_query($conn, "SELECT id, name, email, phone, role, create_at
                         FROM USERS WHERE id = '$id_esc' LIMIT 1")
);

if (!$row) {
    http_response_code(404);
    echo json_encode(['error' => 'User not found']);
    exit;
}

echo json_encode([
    'id'         => $row['id'],
    'name'       => $row['name'],
    'email'      => $row['email'],
    'phone'      => $row['phone'],
    'role'       => $row['role'],
    'joined'     => date('Y', strtotime($row['create_at'])),
]);
