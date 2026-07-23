<?php
$pageTitle = "All Available Rooms";
$pageDescription = "Browse our 22 beautifully appointed rooms. Filter by room type, view, floor, price, or capacity to find your perfect stay in Da Nang, Vietnam.";
$pageStyles = [
  "./assets/css/pages/rooms.css",
  "./assets/css/components/search-bar.css",
  "./assets/css/components/room-card.css"
];
include 'template/header/index.php';
?>

  <main class="rooms-main">
    <div class="container">

      <!-- Catalog Header Row -->
      <div class="results-header-row">
        <h1 class="text-2xl font-bold">All Available Rooms
          <span class="font-normal text-muted-foreground text-lg" id="rooms-count-badge">(22)</span>
        </h1>

        <div class="flex items-center gap-3 flex-wrap flex-1 justify-end">
          <!-- Search input -->
          <div class="search-input-wrapper">
            <input type="text" id="keyword-search-input" class="search-text-input"
              placeholder='Search "sea view", "family suite"…'>
          </div>

          <!-- Dates & Guests Trigger Button -->
          <button type="button" class="search-modal-trigger" id="search-modal-trigger-btn">
            <i data-lucide="calendar" style="width: 15px; height: 15px;"></i>
            <span>Dates Search</span>
          </button>

          <!-- Mobile filter button -->
          <button type="button" class="mobile-filters-trigger" id="mobile-filters-trigger-btn">
            <i data-lucide="sliders-horizontal" style="width: 15px; height: 15px;"></i>
            <span>Filters</span>
            <span class="mobile-filter-badge" id="mobile-filter-count">0</span>
          </button>
        </div>
      </div>

      <!-- Catalog Layout -->
      <div class="catalog-layout">

        <!-- Desktop Sidebar Filters -->
        <aside class="sidebar-filters" id="desktop-filters-aside">
          <!-- Rendered dynamically or via JS -->
        </aside>

        <!-- Room Grid Column -->
        <div class="room-grid-column">
          <div class="room-grid" id="rooms-catalog-grid"></div>

          <!-- Empty State -->
          <div class="empty-state" id="rooms-empty-state">
            <i data-lucide="waves" style="width: 17px; height: 17px;"></i>
            <h3>No rooms match your filters</h3>
            <p>Try adjusting your search filters or typing another keyword.</p>
            <button type="button" class="btn-primary-sm" id="clear-all-filters-btn">Clear all filters</button>
          </div>
        </div>

      </div>

    </div>
  </main>

  <!-- Mobile Filters Bottom Sheet Dialog -->
  <dialog id="mobile-filters-dialog">
    <div class="modal-header">
      <h2>Filters</h2>
      <button class="modal-close-btn" id="close-mobile-filters-btn">
        <i data-lucide="x" style="width: 15px; height: 15px;"></i>
      </button>
    </div>
    <div class="modal-body">
      <div id="mobile-filters-container"></div>
      <button type="button" class="btn-block btn-primary" id="mobile-apply-filters-btn">
        Show Rooms
      </button>
    </div>
  </dialog>

  <!-- Search Modal (Up-pop) -->
  <dialog id="search-modal">
    <div class="modal-header">
      <h2>Search Rooms</h2>
      <button type="button" class="modal-close-btn" id="close-search-modal-btn">
        <i data-lucide="x" style="width: 15px; height: 15px;"></i>
      </button>
    </div>
    <div class="modal-body">
      <div id="rooms-search-bar-container"></div>
      <button type="button" class="btn-block btn-primary" id="search-modal-apply-btn" style="margin-top: 1.5rem;">
        Apply Search
      </button>
    </div>
  </dialog>

<?php
$pageScript = "./assets/js/rooms/rooms.js";
include 'template/footer.php';
?>