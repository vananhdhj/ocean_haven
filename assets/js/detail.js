document.addEventListener("DOMContentLoaded", async () => {
  // Parse Query Parameters
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("id");

  if (!roomId) {
    // window.location.href = "rooms.php";
    return;
  }

  try {
    const res = await fetch('api/get_rooms.php');
    const rooms = await res.json();
    let targetId = roomId;
    if (roomId !== null && roomId !== undefined && !isNaN(roomId)) {
      const num = parseInt(roomId);
      const padded = num.toString().padStart(3, '0');
      targetId = `room-${padded}`;
    }
    const room = rooms.find(r => r.id == targetId || r.id == roomId);
    if (!room) {
      // window.location.href = "rooms.php";
      return;
    }
    initDetailPage(room);
  } catch (err) {
    console.error("Error loading room details:", err);
    // window.location.href = "rooms.php";
  }

  function initDetailPage(room) {
    // Set Document Title Dynamically
    document.title = `${room.name} — Ocean Haven Hotel`;

    // Gallery Active Image Index State
    let activeImgIdx = 0;
    let isLiked = false;

    // Map of amenities to Lucide icons
    const AMENITY_MAP = {
      "Free WiFi": "wifi",
      "Air Conditioning": "sparkles",
      "Flat-screen TV": "tv",
      "4K Smart TV": "tv",
      "Smart TV": "tv",
      "Mini Bar": "coffee",
      "Room Service": "utensils",
      "Sea View": "eye",
      "En-suite Bathroom": "bath",
      "Coffee Maker": "coffee",
      "Garden View": "leaf",
      "Work Desk": "book-open",
      "Car": "car",
      "Balcony": "waves",
      "Rainfall Shower": "waves",
      "Rain Shower": "waves",
      "Freestanding Bathtub": "bath",
      "City View": "building-2",
      "Jacuzzi": "sparkles",
      "Full Kitchen": "utensils",
      "Kitchenette": "utensils",
      "Butler Service": "shield",
      "24h Room Service": "clock",
      "Children's Area": "heart",
      "Espresso Machine": "coffee",
      "Dumbbell": "dumbbell",
      "Laundry": "sparkles"
    };

    const container = document.getElementById("detail-page-container");
    const loadingBox = document.getElementById("detail-loading-box");
    const mobileStickyFooter = document.getElementById("detail-mobile-footer");
    const mobileBookBtn = document.getElementById("mobile-footer-book-btn");

    // Load Layout
    loadingBox.classList.add("hidden");

    const renderPage = () => {
      const viewVariant = room.view === "Sea View" ? "sea" : room.view === "Garden View" ? "garden" : "city";

      // Stars Rating Generation
      let starsHtml = "";
      for (let i = 1; i <= 5; i++) {
        const isFilled = i <= Math.round(room.rating);
        starsHtml += `<i data-lucide="star" class="${isFilled ? 'star-icon' : 'star-icon-muted'}" style="width: 14px; height: 14px;"></i>`;
      }

      container.innerHTML = `
        <!-- Header Actions Row -->
        <div class="detail-header-actions">
          <a href="rooms.php" class="btn-back-link">
            <i data-lucide="arrow-left" style="width: 18px; height: 18px;"></i>
            <span>Back to rooms</span>
          </a>
        </div>

        <!-- Detail Layout Columns -->
        <div class="detail-grid">
          
          <!-- Left Column Content -->
          <div class="flex-col gap-5">
            
            <!-- Image Gallery Container -->
            <div class="gallery-container">
              <div class="gallery-main-wrapper">
                <img src="${room.images[activeImgIdx]}" alt="${room.name} — photo ${activeImgIdx + 1}" class="gallery-main-img" id="gallery-main-display">
                
                ${room.images.length > 1 ? `
                  <button type="button" class="gallery-nav-btn gallery-nav-left" id="gallery-prev-btn">
                    <i data-lucide="chevron-left" style="width: 18px; height: 18px;"></i>
                  </button>
                  <button type="button" class="gallery-nav-btn gallery-nav-right" id="gallery-next-btn">
                    <i data-lucide="chevron-right" style="width: 18px; height: 18px;"></i>
                  </button>
                ` : ''}
                
                <div class="gallery-counter">
                  <i data-lucide="camera" style="width: 12px; height: 12px;"></i>
                  <span id="gallery-count-text">${activeImgIdx + 1}/${room.images.length}</span>
                </div>
              </div>
              
              ${room.images.length > 1 ? `
                <div class="gallery-thumbs" id="gallery-thumbnails">
                  ${room.images.map((img, idx) => `
                    <button type="button" class="gallery-thumb-btn ${activeImgIdx === idx ? 'active' : ''}" data-thumb-idx="${idx}">
                      <img src="${img}" alt="Thumbnail ${idx + 1}">
                    </button>
                  `).join("")}
                </div>
              ` : ''}
            </div>

            <!-- Main Info Details -->
            <div class="detail-title-section">
              <div class="flex flex-wrap gap-2" style="margin-bottom: 0.5rem;">
                <span class="badge badge-type">${room.type}</span>
                <span class="badge badge-${viewVariant}">${room.view}</span>
                <span class="badge badge-default">Floor ${room.floor}</span>
              </div>
              <h1>${room.name}</h1>
              <div class="flex items-center gap-2 mb-4" style="font-size: 0.875rem;">
                <div class="stars-list">${starsHtml}</div>
                <span class="font-bold text-foreground" style="margin-left: 4px;">${room.rating}</span>
                <span class="text-muted-foreground">(${room.reviewCount} reviews)</span>
              </div>
            </div>

            <!-- Key Specs Cards -->
            <div class="detail-specs-grid">
              <div class="detail-spec-card">
                <div class="detail-spec-card-icon">
                  <i data-lucide="building-2" style="width: 18px; height: 18px;"></i>
                </div>
                <p>Room Size</p>
                <p>${room.size} m²</p>
              </div>
              <div class="detail-spec-card">
                <div class="detail-spec-card-icon">
                  <i data-lucide="user" style="width: 18px; height: 18px;"></i>
                </div>
                <p>Max Guests</p>
                <p>${room.maxGuests} guests</p>
              </div>
              <div class="detail-spec-card">
                <div class="detail-spec-card-icon">
                  <i data-lucide="bed-double" style="width: 18px; height: 18px;"></i>
                </div>
                <p>Bed Type</p>
                <p>${room.bedType}</p>
              </div>
              <div class="detail-spec-card">
                <div class="detail-spec-card-icon">
                  <i data-lucide="eye" style="width: 18px; height: 18px;"></i>
                </div>
                <p>View</p>
                <p>${room.view}</p>
              </div>
            </div>

            <!-- About Description -->
            <div class="detail-description-section">
              <h2>About This Room</h2>
              <p>${room.description}</p>
            </div>

            <!-- Amenities Grid -->
            <div class="detail-description-section">
              <h2>Amenities</h2>
              <div class="amenity-detail-grid">
                ${room.amenities.map(a => {
        const iconName = AMENITY_MAP[a] || "sparkles";
        return `
                    <div class="amenity-detail-item">
                      <i data-lucide="${iconName}" style="width: 16px; height: 16px;"></i>
                      <span>${a}</span>
                    </div>
                  `;
      }).join("")}
              </div>
            </div>
          </div>

          <!-- Right Column Sticky Widget -->
          <div>
            <div class="booking-widget-card">
              <div class="booking-widget-price-row">
                <span style="font-size: 1.875rem; font-weight: 700; color: var(--foreground);">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.price)}</span>
                <span style="color: var(--muted-foreground); font-size: 0.875rem;">/ night</span>
              </div>
              
              <div class="booking-widget-rating-row">
                <i data-lucide="star" class="star-icon" style="width: 13px; height: 13px;"></i>
                <span>${room.rating} · ${room.reviewCount} reviews</span>
              </div>

              <div class="booking-widget-specs">
                <div class="booking-widget-spec-item">
                  <p>Room Type</p>
                  <p>${room.type}</p>
                </div>
                <div class="booking-widget-spec-row">
                  <div class="booking-widget-spec-item">
                    <p>Floor</p>
                    <p>Floor ${room.floor}</p>
                  </div>
                  <div class="booking-widget-spec-item">
                    <p>Max Guests</p>
                    <p>Up to ${room.maxGuests}</p>
                  </div>
                </div>
              </div>

              <button type="button" class="btn-block btn-primary" id="widget-book-btn" style="padding: 1rem;">
                Book Now — ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.price)}/night
              </button>

              <div class="booking-widget-terms">
                <div class="booking-widget-term-item">
                  <i data-lucide="shield" class="green-check" style="width: 13px; height: 13px;"></i>
                  <span>Free cancellation up to 48h before check-in</span>
                </div>
                <div class="booking-widget-term-item">
                  <i data-lucide="check-circle" class="green-check" style="width: 13px; height: 13px;"></i>
                  <span>Instant confirmation</span>
                </div>
                <div class="booking-widget-term-item">
                  <i data-lucide="clock" class="blue-clock" style="width: 13px; height: 13px;"></i>
                  <span>Check-in 14:00 · Check-out 12:00</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      `;

      if (window.lucide) window.lucide.createIcons();

      // Gallery chevrons
      if (room.images.length > 1) {
        const mainDisplay = container.querySelector("#gallery-main-display");
        const counterText = container.querySelector("#gallery-count-text");
        const prevBtn = container.querySelector("#gallery-prev-btn");
        const nextBtn = container.querySelector("#gallery-next-btn");
        const thumbBtns = container.querySelectorAll(".gallery-thumb-btn");

        const updateGallery = (newIdx) => {
          activeImgIdx = newIdx;
          mainDisplay.style.opacity = 0.5;
          setTimeout(() => {
            mainDisplay.src = room.images[activeImgIdx];
            mainDisplay.style.opacity = 1;
          }, 100);
          counterText.textContent = `${activeImgIdx + 1}/${room.images.length}`;

          thumbBtns.forEach((btn, bidx) => {
            if (bidx === activeImgIdx) btn.classList.add("active");
            else btn.classList.remove("active");
          });
        };

        prevBtn.addEventListener("click", () => {
          const nextIdx = (activeImgIdx - 1 + room.images.length) % room.images.length;
          updateGallery(nextIdx);
        });

        nextBtn.addEventListener("click", () => {
          const nextIdx = (activeImgIdx + 1) % room.images.length;
          updateGallery(nextIdx);
        });

        thumbBtns.forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-thumb-idx"));
            updateGallery(idx);
          });
        });
      }

      // Hook Booking triggers
      const widgetBookBtn = container.querySelector("#widget-book-btn");
      widgetBookBtn.addEventListener("click", () => {
        window.openBookingModal(room.id);
      });
    };

    // Initial Render
    renderPage();
  }
});