<?php
$pageTitle = "Room Details — Ocean Haven Hotel";
$pageDescription = "View specific room amenities, photos, size, guest limits, pricing, and book your stay online with Ocean Haven Hotel.";
$pageStyles = [
  "./assets/css/pages/detail.css"
];
include 'template/header/index.php';
?>

  <main>
    <div class="container" id="detail-page-container">

      <!-- Loading Placeholder -->
      <div id="detail-loading-box">
        <p class="text-muted-foreground">Loading room details...</p>
      </div>

    </div>
  </main>

<?php
$pageScripts = [
  "./assets/js/detail/detail.templates.js",
  "./assets/js/detail/detail.js",
];
include 'template/footer.php';
?>