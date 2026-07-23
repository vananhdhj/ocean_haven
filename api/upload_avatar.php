<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../auth/session.php';
require_once __DIR__ . '/../config/db-connection.php';

// Must be logged in
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please log in to upload avatar.']);
    exit;
}

$session_user_id = $_SESSION['user_id'];
$user_id_esc     = mysqli_real_escape_string($conn, $session_user_id);

// Check if file was uploaded
if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No file uploaded or upload error occurred.']);
    exit;
}

$file = $_FILES['avatar'];

// Validate file size (max 5MB)
$maxSize = 5 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'File size exceeds 5MB limit.']);
    exit;
}

// Validate file extension
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
$fileExtension     = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($fileExtension, $allowedExtensions)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid file format. Only JPG, PNG, GIF, and WEBP are allowed.']);
    exit;
}

// Target folder: public/images/
$targetDir = __DIR__ . '/../public/images/';
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

// Generate a unique filename
$uniqueFilename = 'avatar_' . $session_user_id . '_' . time() . '.' . $fileExtension;
$targetFilePath = $targetDir . $uniqueFilename;

// Move uploaded file to public/images/
if (!move_uploaded_file($file['tmp_name'], $targetFilePath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save uploaded image file.']);
    exit;
}

// Public URL path stored in database
$avatarUrl = '/final_assigment/public/images/' . $uniqueFilename;
$avatarUrlEsc = mysqli_real_escape_string($conn, $avatarUrl);

// Update database USERS table avatar column
$query = "UPDATE USERS SET avatar = '$avatarUrlEsc' WHERE id = '$user_id_esc' LIMIT 1";
if (mysqli_query($conn, $query)) {
    echo json_encode([
        'success'    => true,
        'message'    => 'Avatar updated successfully.',
        'avatar_url' => $avatarUrl
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database update error: ' . mysqli_error($conn)
    ]);
}
