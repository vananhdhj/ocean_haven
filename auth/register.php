<?php
require_once __DIR__ . '/session.php';
require_once __DIR__ . '/../config/db-connection.php';

// If already logged in, redirect or report success
if (isLoggedIn()) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => true, 'message' => 'Already logged in.']);
        exit;
    } else {
        header('Location: /final_assigment/home.php');
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json; charset=utf-8');

    // Handle both application/json and application/x-www-form-urlencoded
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    $name     = trim($input['name']     ?? '');
    $email    = trim($input['email']    ?? '');
    $phone    = trim($input['phone']    ?? '');
    $password = trim($input['password'] ?? '');
    $confirm  = trim($input['confirm']  ?? '');

    // Validation
    if (empty($name) || empty($email) || empty($phone) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required.']);
        exit;
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Please enter a valid email address.']);
        exit;
    } elseif (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters.']);
        exit;
    } elseif ($password !== $confirm) {
        echo json_encode(['success' => false, 'message' => 'Passwords do not match.']);
        exit;
    }

    $email_esc = mysqli_real_escape_string($conn, $email);

    // Check if email already exists
    $existing = mysqli_fetch_assoc(
        mysqli_query($conn, "SELECT id FROM USERS WHERE email = '$email_esc' LIMIT 1")
    );

    if ($existing) {
        echo json_encode(['success' => false, 'message' => 'An account with this email already exists.']);
        exit;
    } else {
        // Insert new user
        $user_id       = 'usr-' . bin2hex(random_bytes(8));
        $password_hash = password_hash($password, PASSWORD_BCRYPT);
        $name_esc      = mysqli_real_escape_string($conn, $name);
        $phone_esc     = mysqli_real_escape_string($conn, $phone);
        $hash_esc      = mysqli_real_escape_string($conn, $password_hash);

        $insert = "INSERT INTO USERS (id, name, email, role, password_hash, phone)
                   VALUES ('$user_id', '$name_esc', '$email_esc', 'user', '$hash_esc', '$phone_esc')";

        if (mysqli_query($conn, $insert)) {
            // Auto-login after register
            $_SESSION['user_id']    = $user_id;
            $_SESSION['user_name']  = $name;
            $_SESSION['user_email'] = $email;
            $_SESSION['user_phone'] = $phone;
            $_SESSION['user_role']  = 'user';

            echo json_encode(['success' => true, 'message' => 'Registration successful.']);
            exit;
        } else {
            echo json_encode(['success' => false, 'message' => 'Registration failed: ' . mysqli_error($conn)]);
            exit;
        }
    }
} else {
    // GET request: redirect to home and trigger pop-up
    header('Location: /final_assigment/home.php?showRegister=1');
    exit;
}
