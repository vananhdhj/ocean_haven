<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Room Details — Ocean Haven Hotel</title>
  <meta name="description"
    content="View specific room amenities, photos, size, guest limits, pricing, and book your stay online with Ocean Haven Hotel.">
  <link rel="stylesheet" href="global.css">

</head>

<body>

  <!-- Navigation -->
  <header>
    <nav class="navbar" id="navbar">
      <div class="container">
        <!-- Logo -->
        <a href="home.html" class="logo">
          <div class="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="lucide lucide-waves-horizontal-icon lucide-waves-horizontal">
              <path d="M2 12q2.5 2 5 0t5 0 5 0 5 0" />
              <path d="M2 19q2.5 2 5 0t5 0 5 0 5 0" />
              <path d="M2 5q2.5 2 5 0t5 0 5 0 5 0" />
            </svg>
          </div>
          <div class="logo-text">
            <p>Ocean Haven</p>
            <p>Hotel</p>
          </div>
        </a>

        <!-- Desktop Menu Links -->
        <div class="nav-links">
          <a href="home.html" class="nav-btn active">Home</a>
          <a href="rooms.html" class="nav-btn">Rooms</a>
          <a href="#footer" class="nav-btn">Contact</a>
        </div>

        <!-- Actions (Profile, Mobile Menu Toggle) -->
        <div class="nav-actions">
          <button type="button" class="user-profile-btn" id="profile-btn" aria-label="Open profile modal">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="lucide lucide-user-icon lucide-user">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <button type="button" class="menu-toggle-btn" id="menu-toggle" aria-label="Toggle mobile menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="lucide lucide-menu-icon lucide-menu">
              <path d="M4 5h16" />
              <path d="M4 12h16" />
              <path d="M4 19h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>

    <!-- Mobile Navigation Drawer -->
    <div class="mobile-nav" id="mobile-nav">
      <a href="home.html" class="mobile-nav-btn active">Home</a>
      <a href="rooms.html" class="mobile-nav-btn">Rooms</a>
      <a href="#footer" class="mobile-nav-btn">Contact</a>
      <button type="button" class="mobile-nav-btn" id="mobile-profile-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="lucide lucide-user-icon lucide-user">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>My Account</span>
      </button>
    </div>
  </header>

  <main>
    <div class="container" id="detail-page-container">

      <!-- Loading Placeholder -->
      <div id="detail-loading-box">
        <p class="text-muted-foreground">Loading room details...</p>
      </div>

    </div>
  </main>

  <!-- Mobile Sticky Book Bar (Hidden on Desktop) -->
  <div class="mobile-sticky-footer" id="detail-mobile-footer">
    <div class="mobile-sticky-footer-price">
      <span id="mobile-footer-price">$0</span>
      <span> / night</span>
    </div>
    <button type="button" class="btn-primary" id="mobile-footer-book-btn">Book Now</button>
  </div>

  <!-- Footer -->
  <footer class="main-footer" id="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="./home.html">
            <div class="logo mb-4">
              <div class="logo-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  class="lucide lucide-waves-horizontal-icon lucide-waves-horizontal">
                  <path d="M2 12q2.5 2 5 0t5 0 5 0 5 0" />
                  <path d="M2 19q2.5 2 5 0t5 0 5 0 5 0" />
                  <path d="M2 5q2.5 2 5 0t5 0 5 0 5 0" />
                </svg>
              </div>
              <p class="font-bold">Ocean Haven Hotel</p>
            </div>
          </a>
          <p class="logo-desc">22 rooms. 3 floors. One ocean view. Da Nang, Vietnam.</p>
        </div>
        <div>
          <!-- Empty Spacer or quick links -->
        </div>
        <div>
          <h3 class="footer-section-title">Contact</h3>
          <div class="footer-contacts">
            <div class="footer-contact-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-map-pinned-icon lucide-map-pinned">
                <path
                  d="M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 0 1-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0 1 12 0" />
                <circle cx="12" cy="8" r="2" />
                <path
                  d="M8.714 14h-3.71a1 1 0 0 0-.948.683l-2.004 6A1 1 0 0 0 3 22h18a1 1 0 0 0 .948-1.316l-2-6a1 1 0 0 0-.949-.684h-3.712" />
              </svg>
              <span>&nbsp; 123 Vo Nguyen Giap, Da Nang</span>
            </div>
            <div class="footer-contact-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-phone-incoming-icon lucide-phone-incoming">
                <path d="M16 2v6h6" />
                <path d="m22 2-6 6" />
                <path
                  d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
              </svg>
              <span>&nbsp; +84 236 3 888 888</span>
            </div>
            <div class="footer-contact-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-mails-icon lucide-mails">
                <path d="M17 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 1-1.732" />
                <path d="m22 5.5-6.419 4.179a2 2 0 0 1-2.162 0L7 5.5" />
                <rect x="7" y="3" width="15" height="12" rx="2" />
              </svg>
              <span>&nbsp; hello@oceanhavenhotel.com</span>
            </div>
          </div>
        </div>
      </div>

      <div class="copyright">
        <p>© 2025 Ocean Haven Hotel. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <!-- Scripts -->
  <script src="db.js"></script>
  <script src="global.js"></script>
  <script src="detail.js"></script>

</body>

</html>