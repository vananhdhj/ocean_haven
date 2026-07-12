<?php
$current_page = basename($_SERVER['PHP_SELF']);
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo isset($pageTitle) ? $pageTitle : "Ocean Haven Hotel"; ?></title>
  <meta name="description" content="<?php echo isset($pageDescription) ? $pageDescription : "22 beautifully appointed rooms across 3 floors, steps from the sea. Ocean Haven is where families make memories that last a lifetime in Da Nang, Vietnam."; ?>">
  <link rel="stylesheet" href="./assets/css/global.css">
</head>

<body>
  <!-- Navigation -->
  <header>
    <nav class="navbar" id="navbar">
      <div class="container">
        <!-- Logo -->
        <a href="home.php" class="logo">
          <div class="logo-icon">
            <i data-lucide="waves" style="width: 17px; height: 17px;"></i>
          </div>
          <div class="logo-text">
            <p>Ocean Haven</p>
            <p>Hotel</p>
          </div>
        </a>

        <!-- Desktop Menu Links -->
        <div class="nav-links">
          <a href="home.php" class="nav-btn <?php echo ($current_page == 'home.php') ? 'active' : ''; ?>">Home</a>
          <a href="rooms.php" class="nav-btn <?php echo ($current_page == 'rooms.php') ? 'active' : ''; ?>">Rooms</a>
          <a href="#footer" class="nav-btn">Contact</a>
        </div>

        <!-- Actions (Profile, Mobile Menu Toggle) -->
        <div class="nav-actions">
          <button type="button" class="user-profile-btn" id="profile-btn" aria-label="Open profile modal">
            <i data-lucide="user" style="width: 18px; height: 18px;"></i>
          </button>
          <button type="button" class="menu-toggle-btn" id="menu-toggle" aria-label="Toggle mobile menu">
            <i data-lucide="menu" style="width: 24px; height: 24px;"></i>
          </button>
        </div>
      </div>
    </nav>

    <!-- Mobile Navigation Drawer -->
    <div class="mobile-nav" id="mobile-nav">
      <a href="home.php" class="mobile-nav-btn <?php echo ($current_page == 'home.php') ? 'active' : ''; ?>">Home</a>
      <a href="rooms.php" class="mobile-nav-btn <?php echo ($current_page == 'rooms.php') ? 'active' : ''; ?>">Rooms</a>
      <a href="#footer" class="mobile-nav-btn">Contact</a>
    </div>
  </header>
