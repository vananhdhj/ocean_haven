<?php
// Shared session bootstrap — include at the top of every PHP page/API that needs auth.

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Redirect to login if the user is not authenticated.
 * Stores the current URL so we can redirect back after login.
 */
function requireLogin(): void {
    if (empty($_SESSION['user_id'])) {
        $returnTo = urlencode($_SERVER['REQUEST_URI'] ?? '');
        header('Location: /final_assigment/auth/login.php?next=' . $returnTo);
        exit;
    }
}

/**
 * Require the user to be logged in AND have role = 'admin'.
 * Returns HTTP 403 for non-admin authenticated users.
 */
function requireAdmin(): void {
    requireLogin();
    if (($_SESSION['user_role'] ?? '') !== 'admin') {
        http_response_code(403);
        echo '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">
              <h2>403 — Forbidden</h2>
              <p>You do not have permission to access this page.</p>
              <a href="/final_assigment/home.php">← Back to home</a>
              </body></html>';
        exit;
    }
}

/**
 * Returns the current logged-in user's session data, or null if not logged in.
 *
 * @return array{id:string,name:string,email:string,role:string,phone:string}|null
 */
function currentUser(): ?array {
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    return [
        'id'    => $_SESSION['user_id'],
        'name'  => $_SESSION['user_name']  ?? '',
        'email' => $_SESSION['user_email'] ?? '',
        'role'  => $_SESSION['user_role']  ?? 'user',
        'phone' => $_SESSION['user_phone'] ?? '',
    ];
}

/**
 * Returns true if the current session belongs to an admin user.
 */
function isAdmin(): bool {
    return ($_SESSION['user_role'] ?? '') === 'admin';
}

/**
 * Returns true if any user is currently logged in.
 */
function isLoggedIn(): bool {
    return !empty($_SESSION['user_id']);
}
