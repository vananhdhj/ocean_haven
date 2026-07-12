<?php
$pageTitle = "Hotel Booking Site";
$pageDescription = "22 beautifully appointed rooms across 3 floors, steps from the sea. Ocean Haven is where families make memories that last a lifetime in Da Nang, Vietnam.";
include 'template/header.php';
?>

<main>
  <!-- Hero Section -->
  <section class="hero">
    <img src="https://images.unsplash.com/photo-1664189767954-e4e605ae46da?w=1600&h=1000&fit=crop&auto=format"
      alt="Ocean Haven Hotel — patio with sea view" class="hero-bg">
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <h1>
        Hotel Listing & Booking Website
      </h1>
    </div>
  </section>

  <!-- Featured Rooms -->
  <section class="feature-rooms">
    <div class="container">
      <div class="section-header">
        <div class="section-title-wrapper">
          <p>Curated for You</p>
          <h2 class="section-title">Featured Rooms</h2>
        </div>
        <a href="rooms.php" class="section-link">
          <span>View all 22 rooms</span>
          <i data-lucide="chevrons-right" style="width: 17px; height: 17px;"></i>
        </a>
      </div>

      <!-- Featured Rooms Grid -->
      <div class="room-grid" id="featured-rooms-grid">
        <!-- Room cards will be rendered dynamically here -->
      </div>
    </div>
  </section>
</main>

<?php
$pageScript = "./assets/js/home.js";
include 'template/footer.php';
?>