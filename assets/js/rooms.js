
document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Search Bar
  initSearchBar("#rooms-search-bar-container", async (searchData) => {
    await loadRoomsAndRender();
  });

  // Filter state variables
  let filters = {
    types: [],
    floors: [],
    views: [],
    priceMin: 1500000,
    priceMax: 7500000,
    guests: 0
  };

  let keyword = "";

  // Load references
  let rooms = [];
  const roomsGrid = document.getElementById("rooms-catalog-grid");
  const emptyState = document.getElementById("rooms-empty-state");
  const roomsCountBadge = document.getElementById("rooms-count-badge");
  const keywordInput = document.getElementById("keyword-search-input");
  const clearAllBtn = document.getElementById("clear-all-filters-btn");

  const mobileFiltersTrigger = document.getElementById("mobile-filters-trigger-btn");
  const mobileFiltersCountBadge = document.getElementById("mobile-filter-count");
  const mobileFiltersDialog = document.getElementById("mobile-filters-dialog");
  const closeMobileFiltersBtn = document.getElementById("close-mobile-filters-btn");
  const mobileApplyFiltersBtn = document.getElementById("mobile-apply-filters-btn");

  // Set up keyword search event
  keywordInput.addEventListener("input", (e) => {
    keyword = e.target.value;
    applyFiltersAndRender();
  });

  // Clear all triggers
  clearAllBtn.addEventListener("click", () => {
    clearFilters();
  });

  // Mobile dialog bindings
  mobileFiltersTrigger.addEventListener("click", () => {
    mobileFiltersDialog.showModal();
    renderFilters("#mobile-filters-container", true);
  });
  closeMobileFiltersBtn.addEventListener("click", () => mobileFiltersDialog.close());
  mobileApplyFiltersBtn.addEventListener("click", () => mobileFiltersDialog.close());

  // Search Modal (Up-pop) bindings
  const searchModal = document.getElementById("search-modal");
  const searchModalTrigger = document.getElementById("search-modal-trigger-btn");
  const closeSearchModalBtn = document.getElementById("close-search-modal-btn");
  const searchModalApplyBtn = document.getElementById("search-modal-apply-btn");

  if (searchModalTrigger && searchModal) {
    searchModalTrigger.addEventListener("click", () => {
      searchModal.showModal();
    });
  }
  if (closeSearchModalBtn && searchModal) {
    closeSearchModalBtn.addEventListener("click", () => {
      searchModal.close();
    });
  }
  if (searchModalApplyBtn && searchModal) {
    searchModalApplyBtn.addEventListener("click", async () => {
      searchModal.close();
      await loadRoomsAndRender();
    });
  }

  // Helper to clear filters
  function clearFilters() {
    filters = {
      types: [],
      floors: [],
      views: [],
      priceMin: 1500000,
      priceMax: 7500000,
      guests: 0
    };
    keyword = "";
    keywordInput.value = "";
    applyFiltersAndRender();
    renderFilters("#desktop-filters-aside", false);
  }

  // Dynamic Filter Panel Markup Generator
  function renderFilters(containerSelector, isMobile) {
    const target = document.querySelector(containerSelector);
    if (!target) return;

    const allTypes = ["Standard", "Deluxe", "Family Suite", "Connecting Room"];
    const allFloors = [1, 2, 3];
    const allViews = ["Sea View", "City View", "Garden View"];

    target.innerHTML = `
          <div class="filter-panel">
            <div class="flex items-center justify-between" style="border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
              <span class="font-bold text-foreground">Filters</span>
              <button type="button" class="text-xs text-primary font-bold hover:underline" id="clear-link-${isMobile ? 'm' : 'd'}">Clear all</button>
            </div>

            <!-- Room Type -->
            <div class="filter-section">
              <span class="filter-title">Room Type</span>
              <div class="flex flex-col gap-2">
                ${allTypes.map(t => `
                  <label class="checkbox-label">
                    <input type="checkbox" value="${t}" class="type-filter-checkbox" ${filters.types.includes(t) ? 'checked' : ''}>
                    <span>${t}</span>
                  </label>
                `).join("")}
              </div>
            </div>

            <!-- Floor -->
            <div class="filter-section">
              <span class="filter-title">Floor</span>
              <div class="filter-btn-group">
                ${allFloors.map(f => `
                  <button type="button" class="filter-btn floor-filter-btn ${filters.floors.includes(f) ? 'active' : ''}" data-floor="${f}">Floor ${f}</button>
                `).join("")}
              </div>
            </div>

            <!-- View -->
            <div class="filter-section">
              <span class="filter-title">View</span>
              <div class="flex flex-col gap-2">
                ${allViews.map(v => `
                  <label class="checkbox-label">
                    <input type="checkbox" value="${v}" class="view-filter-checkbox" ${filters.views.includes(v) ? 'checked' : ''}>
                    <span>${v}</span>
                  </label>
                `).join("")}
              </div>
            </div>

            <!-- Price -->
            <div class="filter-section">
              <span class="filter-title">Price per Night</span>
              <div class="price-range-inputs">
                <div class="price-input-box">
                  <p>Min</p>
                  <p>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(filters.priceMin)}</p>
                </div>
                <span style="color: var(--muted-foreground);">—</span>
                <div class="price-input-box">
                  <p>Max</p>
                  <p>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(filters.priceMax)}</p>
                </div>
              </div>
              <input type="range" min="1500000" max="7500000" step="250000" value="${filters.priceMax}" class="price-range-slider" id="price-slider-${isMobile ? 'm' : 'd'}">
            </div>

            <!-- Guests Capacity -->
            <div class="filter-section">
              <span class="filter-title">Min. Guests Capacity</span>
              <div class="filter-capacity-grid">
                ${[1, 2, 3, 4, 5, 6].map(g => `
                  <button type="button" class="capacity-btn capacity-filter-btn ${filters.guests === g ? 'active' : ''}" data-capacity="${g}">${g}+</button>
                `).join("")}
              </div>
            </div>
          </div>
        `;

    // Bind events inside filter panel
    const clearLink = target.querySelector(`#clear-link-${isMobile ? 'm' : 'd'}`);
    clearLink.addEventListener("click", () => {
      clearFilters();
      renderFilters(containerSelector, isMobile);
    });

    // Type checkboxes
    const typeCheckboxes = target.querySelectorAll(".type-filter-checkbox");
    typeCheckboxes.forEach(cb => {
      cb.addEventListener("change", () => {
        const val = cb.value;
        if (cb.checked) {
          filters.types.push(val);
        } else {
          filters.types = filters.types.filter(x => x !== val);
        }
        applyFiltersAndRender();
        syncMobileDesktopFilters(isMobile);
      });
    });

    // Floor buttons
    const floorBtns = target.querySelectorAll(".floor-filter-btn");
    floorBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const floor = parseInt(btn.getAttribute("data-floor"));
        if (filters.floors.includes(floor)) {
          filters.floors = filters.floors.filter(x => x !== floor);
          btn.classList.remove("active");
        } else {
          filters.floors.push(floor);
          btn.classList.add("active");
        }
        applyFiltersAndRender();
        syncMobileDesktopFilters(isMobile);
      });
    });

    // View checkboxes
    const viewCheckboxes = target.querySelectorAll(".view-filter-checkbox");
    viewCheckboxes.forEach(cb => {
      cb.addEventListener("change", () => {
        const val = cb.value;
        if (cb.checked) {
          filters.views.push(val);
        } else {
          filters.views = filters.views.filter(x => x !== val);
        }
        applyFiltersAndRender();
        syncMobileDesktopFilters(isMobile);
      });
    });

    // Price slider
    const priceSlider = target.querySelector(`#price-slider-${isMobile ? 'm' : 'd'}`);
    priceSlider.addEventListener("input", (e) => {
      filters.priceMax = parseInt(e.target.value);
      applyFiltersAndRender();

      // Re-render only price texts to optimize performance
      const priceBoxes = target.querySelectorAll(".price-input-box");
      if (priceBoxes.length >= 2) {
        priceBoxes[1].querySelector("p:last-child").textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(filters.priceMax);
      }
    });

    priceSlider.addEventListener("change", () => {
      syncMobileDesktopFilters(isMobile);
    });

    // Guests Capacity
    const capacityBtns = target.querySelectorAll(".capacity-filter-btn");
    capacityBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const capacity = parseInt(btn.getAttribute("data-capacity"));
        if (filters.guests === capacity) {
          filters.guests = 0;
          btn.classList.remove("active");
        } else {
          filters.guests = capacity;
          capacityBtns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
        }
        applyFiltersAndRender();
        syncMobileDesktopFilters(isMobile);
      });
    });
  }

  function syncMobileDesktopFilters(fromMobile) {
    if (fromMobile) {
      renderFilters("#desktop-filters-aside", false);
    } else {
      renderFilters("#mobile-filters-container", true);
    }
  }

  // Filter and Render Logic
  function applyFiltersAndRender() {
    const filtered = rooms.filter(r => {
      // Room types filter
      if (filters.types.length > 0 && !filters.types.includes(r.type)) return false;

      // Floors filter
      if (filters.floors.length > 0 && !filters.floors.includes(r.floor)) return false;

      // Views filter
      if (filters.views.length > 0 && !filters.views.includes(r.view)) return false;

      // Price slider filter
      if (r.price > filters.priceMax) return false;

      // Guests capacity filter
      if (filters.guests > 0 && r.maxGuests < filters.guests) return false;

      // Keyword text search filter
      if (keyword.trim() !== "") {
        const kw = keyword.toLowerCase();
        const nameMatch = r.name.toLowerCase().includes(kw);
        const typeMatch = r.type.toLowerCase().includes(kw);
        const viewMatch = r.view.toLowerCase().includes(kw);
        const amenityMatch = r.amenities.some(a => a.toLowerCase().includes(kw));
        if (!nameMatch && !typeMatch && !viewMatch && !amenityMatch) return false;
      }

      return true;
    });

    // Update count text
    roomsCountBadge.textContent = `(${filtered.length})`;

    // Calculate active filter counts for mobile badge
    const activeCount =
      filters.types.length +
      filters.floors.length +
      filters.views.length +
      (filters.priceMax < 7500000 ? 1 : 0) +
      (filters.guests > 0 ? 1 : 0);

    if (activeCount > 0) {
      mobileFiltersCountBadge.textContent = activeCount;
      mobileFiltersCountBadge.classList.remove("hidden");
    } else {
      mobileFiltersCountBadge.classList.add("hidden");
    }

    // Render rooms catalog grid
    if (filtered.length === 0) {
      roomsGrid.classList.add("hidden");
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
      roomsGrid.classList.remove("hidden");

      roomsGrid.innerHTML = filtered.map(room => {
        const viewVariant = room.view === "Sea View" ? "sea" : room.view === "Garden View" ? "garden" : "city";

        // Stars Rating Generation
        let starsHtml = "";
        for (let i = 1; i <= 5; i++) {
          const isFilled = i <= Math.round(room.rating);
          starsHtml += `<i data-lucide="star" class="${isFilled ? 'star-icon' : 'star-icon-muted'}" style="width: 12px; height: 12px;"></i>
                        `;
        }

        return `
              <div class="room-card" onclick="window.location.href='detail.php?id=${room.id}'" style="cursor: pointer;">
                <div class="room-card-img-wrapper">
                  <img src="${room.image}" alt="${room.name}" class="room-card-img">
                  <div class="room-card-badges">
                    <span class="badge badge-type">${room.type}</span>
                    <span class="badge badge-${viewVariant}">${room.view}</span>
                  </div>
                  <div class="room-card-rating-badge">
                    <i data-lucide="star" class="star-icon" style="width: 12px; height: 12px;"></i>
                    <span>${room.rating}</span>
                  </div>
                </div>
                <div class="room-card-body">
                  <h3 class="room-card-title">${room.name}</h3>
                  <div class="room-card-specs">
                    <div class="room-card-spec-item">
                      <i data-lucide="bed-double" style="width: 13px; height: 13px;"></i>
                      <span>${room.beds} ${room.bedType}</span>
                    </div>
                    <div class="room-card-spec-item">
                      <i data-lucide="eye" style="width: 13px; height: 13px;"></i>
                      <span>${room.view}</span>
                    </div>
                    <div class="room-card-spec-item">
                      <span>Floor ${room.floor}</span>
                    </div>
                  </div>
                  <div class="room-card-rating-row">
                    <div class="stars-list">${starsHtml}</div>
                    <span class="font-bold text-foreground" style="margin-left: 4px;">${room.rating}</span>
                    <span>(${room.reviewCount} reviews)</span>
                  </div>
                  
                  <div class="room-card-footer">
                    <div>
                      <span class="room-card-price">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.price)}</span>
                      <span class="room-card-price-period">/ night</span>
                    </div>
                    <button type="button" class="btn-primary-sm">View Room</button>
                  </div>
                </div>
              </div>
            `;
      }).join("");

      if (window.lucide) window.lucide.createIcons();
    }

    // Show room apply counts on mobile modal footer
    if (mobileApplyFiltersBtn) {
      mobileApplyFiltersBtn.textContent = `Show ${filtered.length} Room${filtered.length !== 1 ? 's' : ''}`;
    }
  }

  const loadRoomsAndRender = async () => {
    try {
      const searchState = window.HotelDb.getSearchState();
      const checkinParam = searchState.checkIn || "";
      const checkoutParam = searchState.checkOut || "";

      const res = await fetch(`api/get_rooms.php?checkin=${checkinParam}&checkout=${checkoutParam}`);
      rooms = await res.json();

      applyFiltersAndRender();
    } catch (err) {
      console.error("Error loading rooms:", err);
    }
  };

  // Load rooms and render initially
  renderFilters("#desktop-filters-aside", false);
  await loadRoomsAndRender();
});
