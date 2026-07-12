<?php
$pageTitle = "Room Details — Ocean Haven Hotel";
$pageDescription = "View specific room amenities, photos, size, guest limits, pricing, and book your stay online with Ocean Haven Hotel.";
include 'template/header.php';
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
$pageScript = "./assets/js/detail.js";
include 'template/footer.php';
?>