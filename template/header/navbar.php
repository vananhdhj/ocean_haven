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
      <a href="home.php"  class="nav-btn <?php echo ($current_page === 'home.php')  ? 'active' : ''; ?>">Home</a>
      <a href="rooms.php" class="nav-btn <?php echo ($current_page === 'rooms.php') ? 'active' : ''; ?>">Rooms</a>
      <a href="#footer"   class="nav-btn">Contact</a>
      <?php if ($user && $user['role'] === 'admin'): ?>
        <a href="/ocean_haven/admin/index.php" class="nav-btn" style="color:var(--accent-foreground);">
          <i data-lucide="shield" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:3px;"></i>Admin
        </a>
      <?php endif; ?>
    </div>

    <!-- Actions (Profile, Mobile Menu Toggle) -->
    <div class="nav-actions">
      <?php if ($user): ?>
        <!-- Logged in: show avatar button with user initial -->
        <button type="button" class="user-profile-btn" id="profile-btn" aria-label="Open profile modal"
                title="<?php echo htmlspecialchars($user['name']); ?>">
          <span style="font-size:0.8125rem;font-weight:700;letter-spacing:0.02em;">
            <?php echo htmlspecialchars(mb_strtoupper(mb_substr($user['name'], 0, 1))); ?>
          </span>
        </button>
      <?php else: ?>
        <!-- Not logged in: show Sign In pop-up trigger -->
        <button type="button" class="nav-btn" id="nav-signin-btn"
           style="background:var(--primary-btn-bg);color:#fff;padding:0.4rem 1rem;border-radius:var(--radius-full);font-weight:600;font-size:0.875rem;cursor:pointer;border:none;">
          Sign In
        </button>
      <?php endif; ?>

      <button type="button" class="menu-toggle-btn" id="menu-toggle" aria-label="Toggle mobile menu">
        <i data-lucide="menu" style="width: 24px; height: 24px;"></i>
      </button>
    </div>
  </div>
</nav>

<!-- Mobile Navigation Drawer -->
<div class="mobile-nav" id="mobile-nav">
  <a href="home.php"  class="mobile-nav-btn <?php echo ($current_page === 'home.php')  ? 'active' : ''; ?>">Home</a>
  <a href="rooms.php" class="mobile-nav-btn <?php echo ($current_page === 'rooms.php') ? 'active' : ''; ?>">Rooms</a>
  <a href="#footer"   class="mobile-nav-btn">Contact</a>
  <?php if ($user): ?>
    <button type="button" class="mobile-nav-btn" id="mobile-profile-btn" style="text-align:left;width:100%;">
      <i data-lucide="user" style="width:15px;height:15px;display:inline;vertical-align:middle;margin-right:6px;"></i>
      My Account
    </button>
    <a href="/ocean_haven/auth/logout.php" class="mobile-nav-btn" style="color:#dc2626;">
      <i data-lucide="log-out" style="width:15px;height:15px;display:inline;vertical-align:middle;margin-right:6px;"></i>
      Sign Out
    </a>
  <?php else: ?>
    <button type="button" class="mobile-nav-btn" id="mobile-signin-btn" style="text-align:left;width:100%;background:none;border:none;cursor:pointer;color:inherit;font-family:inherit;font-size:inherit;">Sign In</button>
    <button type="button" class="mobile-nav-btn" id="mobile-register-btn" style="text-align:left;width:100%;background:none;border:none;cursor:pointer;color:inherit;font-family:inherit;font-size:inherit;">Create Account</button>
  <?php endif; ?>
</div>
