<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../auth/session.php';
require_once __DIR__ . '/../config/db-connection.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthenticated']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

$name  = trim($input['name']  ?? '');
$phone = trim($input['phone'] ?? '');

if (empty($name) || empty($phone)) {
    echo json_encode(['success' => false, 'message' => 'Name and phone are required.']);
    exit;
}

$user_id   = $_SESSION['user_id'];
$id_esc    = mysqli_real_escape_string($conn, $user_id);
$name_esc  = mysqli_real_escape_string($conn, $name);
$phone_esc = mysqli_real_escape_string($conn, $phone);

$ok = mysqli_query($conn,
    "UPDATE USERS SET name = '$name_esc', phone = '$phone_esc'
     WHERE id = '$id_esc' LIMIT 1"
);

if ($ok) {
    // Keep session in sync
    $_SESSION['user_name']  = $name;
    $_SESSION['user_phone'] = $phone;

    echo json_encode(['success' => true, 'message' => 'Profile updated successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . mysqli_error($conn)]);
}
