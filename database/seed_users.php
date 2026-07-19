<?php
/**
 * database/seed_users.php
 * ─────────────────────────────────────────────────────────────────────────
 * Run this script ONCE via browser or CLI to insert the default seed users.
 * After running, delete or move this file outside the web root for security.
 *
 * Browser: http://localhost/final_assigment/database/seed_users.php
 * CLI    : php /Applications/XAMPP/xamppfiles/htdocs/final_assigment/database/seed_users.php
 * ─────────────────────────────────────────────────────────────────────────
 */

require_once __DIR__ . '/../config/db-connection.php';

// ── Seed accounts ────────────────────────────────────────────────────────
$users = [
    [
        'id'       => 'usr-admin-00000001',
        'name'     => 'Hotel Admin',
        'email'    => 'adminSieuCute@gmail.com',
        'phone'    => '0900000001',
        'role'     => 'admin',
        'password' => 'bietLamGi',
    ],
    [
        'id'       => 'usr-guest-00000001',
        'name'     => 'Nguyen Van An',
        'email'    => 'guest@example.com',
        'phone'    => '0901234567',
        'role'     => 'user',
        'password' => 'guest123',
    ],
];

$results = [];

foreach ($users as $u) {
    // Check if already exists
    $email_esc = mysqli_real_escape_string($conn, $u['email']);
    $existing  = mysqli_fetch_assoc(
        mysqli_query($conn, "SELECT id FROM USERS WHERE email = '$email_esc' LIMIT 1")
    );

    if ($existing) {
        $results[] = ['email' => $u['email'], 'status' => 'skipped (already exists)', 'ok' => null];
        continue;
    }

    $id_esc    = mysqli_real_escape_string($conn, $u['id']);
    $name_esc  = mysqli_real_escape_string($conn, $u['name']);
    $phone_esc = mysqli_real_escape_string($conn, $u['phone']);
    $role_esc  = mysqli_real_escape_string($conn, $u['role']);
    $hash      = password_hash($u['password'], PASSWORD_BCRYPT);
    $hash_esc  = mysqli_real_escape_string($conn, $hash);

    $ok = mysqli_query($conn,
        "INSERT INTO USERS (id, name, email, role, password_hash, phone)
         VALUES ('$id_esc', '$name_esc', '$email_esc', '$role_esc', '$hash_esc', '$phone_esc')"
    );

    $results[] = [
        'email'    => $u['email'],
        'password' => $u['password'],
        'role'     => $u['role'],
        'status'   => $ok ? 'inserted ✅' : ('FAILED ❌ — ' . mysqli_error($conn)),
        'ok'       => $ok,
    ];
}

// ── Output ────────────────────────────────────────────────────────────────
$isCLI = php_sapi_name() === 'cli';

if ($isCLI) {
    echo "\n── Seed Users Result ──────────────────────────────────────\n";
    foreach ($results as $r) {
        echo sprintf("  %-36s  %s\n", $r['email'], $r['status']);
        if (!empty($r['password'])) {
            echo sprintf("    password: %s   role: %s\n", $r['password'], $r['role']);
        }
    }
    echo "────────────────────────────────────────────────────────────\n\n";
} else {
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Seed Users — Ocean Haven</title>
  <link rel="stylesheet" href="/final_assigment/assets/css/seed.css">
</head>
<body>
  <h1>🌊 Ocean Haven — Seed Users</h1>
  <table>
    <thead>
      <tr><th>Email</th><th>Password</th><th>Role</th><th>Result</th></tr>
    </thead>
    <tbody>
      <?php foreach ($results as $r): ?>
        <tr>
          <td><?= htmlspecialchars($r['email']) ?></td>
          <td><?= htmlspecialchars($r['password'] ?? '—') ?></td>
          <td><?= htmlspecialchars($r['role'] ?? '—') ?></td>
          <td class="<?= $r['ok'] === true ? 'ok' : ($r['ok'] === null ? 'skip' : 'err') ?>">
            <?= htmlspecialchars($r['status']) ?>
          </td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
  <div class="warn">
    ⚠️ <strong>Security:</strong> Delete or move this file after running it.
    It should not be accessible in production.
    <br><br>
    <a href="/final_assigment/auth/login.php">→ Go to Login</a>
  </div>
</body>
</html>
    <?php
}
