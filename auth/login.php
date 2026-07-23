<?php
require_once __DIR__ . '/session.php';
require_once __DIR__ . '/../config/db-connection.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

// If already logged in, report success
if (isLoggedIn()) {
    echo json_encode(['success' => true, 'message' => 'Already logged in.']);
    exit;
}

// Handle both application/json and application/x-www-form-urlencoded
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$email    = trim($input['email']    ?? '');
$password = trim($input['password'] ?? '');

if (empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Please enter both email and password.']);
    exit;
}

$email_esc = mysqli_real_escape_string($conn, $email);
$row = mysqli_fetch_assoc(
    mysqli_query($conn, "SELECT id, name, email, phone, role, password_hash
                         FROM USERS WHERE email = '$email_esc' LIMIT 1")
);

if ($row && password_verify($password, $row['password_hash'])) {
    // Auth success — populate session
    $_SESSION['user_id']    = $row['id'];
    $_SESSION['user_name']  = $row['name'];
    $_SESSION['user_email'] = $row['email'];
    $_SESSION['user_phone'] = $row['phone'];
    $_SESSION['user_role']  = $row['role'];

    echo json_encode(['success' => true, 'message' => 'Login successful.']);
    exit;
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid email or password. Please try again.']);
    exit;
}
