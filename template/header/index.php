<?php
require_once __DIR__ . '/../../auth/session.php';
$current_page = basename($_SERVER['PHP_SELF']);
$user         = currentUser(); // null if not logged in
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo isset($pageTitle) ? $pageTitle : 'Ocean Haven Hotel'; ?></title>
  <meta name="description" content="<?php echo isset($pageDescription) ? $pageDescription : '22 beautifully appointed rooms across 3 floors, steps from the sea. Ocean Haven is where families make memories that last a lifetime in Da Nang, Vietnam.'; ?>">
  <link rel="stylesheet" href="./assets/css/global.css">
</head>

<body>
  <!-- Navigation -->
  <header>
    <?php
    include __DIR__ . '/navbar.php';
    include __DIR__ . '/login-modal.php';
    include __DIR__ . '/register-modal.php';
    ?>
  </header>
