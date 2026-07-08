document.addEventListener("DOMContentLoaded", () => {
  // Parse Query Parameters
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("id");

  if (!roomId) {
    window.location.href = "rooms.php";
    return;
  }

  const room = window.HotelDb.getRoomById(roomId);
  if (!room) {
    window.location.href = "rooms.php";
    return;
  }

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
  const mobilePriceText = document.getElementById("mobile-footer-price");
  const mobileBookBtn = document.getElementById("mobile-footer-book-btn");

  // Load Layout
  loadingBox.classList.add("hidden");

  const renderPage = () => {
    const viewVariant = room.view === "Sea View" ? "sea" : room.view === "Garden View" ? "garden" : "city";

    // Stars Rating Generation
    let starsHtml = "";
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= Math.round(room.rating);
      starsHtml += `<svg 
                      xmlns="http://w3.org" 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      stroke-width="2" 
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      class="lucide lucide-star ${isFilled ? 'star-icon' : 'star-icon-muted'}"
                    >
                      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
                    </svg>
                    `;
    }

    container.innerHTML = `
          <!-- Header Actions Row -->
          <div class="detail-header-actions">
            <a href="rooms.php" class="btn-back-link">
              <svg
                xmlns="http://w3.org"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-arrow-left"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              <span>Back to rooms</span>
            </a>
            <button type="button" class="btn-like-toggle ${isLiked ? 'liked' : ''}" id="like-toggle-btn">
              <svg
                xmlns="http://w3.org"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-heart ${isLiked ? 'fill-red-500' : ''}"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
              <span>${isLiked ? 'Saved' : 'Save'}</span>
            </button>
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
                      <svg
                        xmlns="http://w3.org"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-chevron-left"
                      >
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                    </button>
                    <button type="button" class="gallery-nav-btn gallery-nav-right" id="gallery-next-btn">
                      <svg
                        xmlns="http://w3.org"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-chevron-right"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  ` : ''}
                  
                  <div class="gallery-counter">
                    <svg 
                      xmlns="http://w3.org" 
                      width="12" 
                      height="12" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      stroke-width="2" 
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      class="lucide lucide-camera"
                    >
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                      <circle cx="12" cy="13" r="3"/>
                    </svg>
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
                    <svg 
                      xmlns="http://w3.org" 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      stroke-width="2" 
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      class="lucide lucide-building-2"
                    >
                      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
                      <path d="M18 22H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2" />
                      <path d="M14 22h4a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-2" />
                      <path d="M12 18h.01" />
                      <path d="M12 14h.01" />
                      <path d="M12 10h.01" />
                      <path d="M12 6h.01" />
                      <path d="M10 6h.01" />
                      <path d="M14 6h.01" />
                      <path d="M10 10h.01" />
                      <path d="M14 10h.01" />
                      <path d="M10 14h.01" />
                      <path d="M14 14h.01" />
                      <path d="M10 18h.01" />
                      <path d="M14 18h.01" />
                    </svg>
                  </div>
                  <p>Room Size</p>
                  <p>${room.size} m²</p>
                </div>
                <div class="detail-spec-card">
                  <div class="detail-spec-card-icon">
                    <svg 
                      xmlns="http://w3.org" 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      stroke-width="2" 
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      class="lucide lucide-user"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <p>Max Guests</p>
                  <p>${room.maxGuests} guests</p>
                </div>
                <div class="detail-spec-card">
                  <div class="detail-spec-card-icon">
                    <svg 
                      xmlns="http://w3.org" 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      stroke-width="2" 
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      class="lucide lucide-bed-double"
                    >
                      <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/>
                      <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/>
                      <path d="M12 4v6"/>
                      <path d="M2 18h20"/>
                    </svg>
                  </div>
                  <p>Bed Type</p>
                  <p>${room.bedType}</p>
                </div>
                <div class="detail-spec-card">
                  <div class="detail-spec-card-icon">
                    <svg 
                      xmlns="http://w3.org" 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      stroke-width="2" 
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      class="lucide lucide-eye"
                    >
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
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

              <!-- Green availability notice -->
              <div class="notice-box-green" style="margin-top: 1.5rem;">
                <svg 
                  xmlns="http://w3.org" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  stroke-width="2" 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  class="lucide lucide-check-circle"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
                <div>
                  <p>Available for your dates</p>
                  <p>Instant confirmation — no waiting required.</p>
                </div>
              </div>

            </div>

            <!-- Right Column Sticky Widget -->
            <div>
              <div class="booking-widget-card">
                <div class="booking-widget-price-row">
                  <span style="font-size: 1.875rem; font-weight: 700; color: var(--foreground);">$${room.price}</span>
                  <span style="color: var(--muted-foreground); font-size: 0.875rem;">/ night</span>
                </div>
                
                <div class="booking-widget-rating-row">
                  <svg 
                    xmlns="http://w3.org" 
                    width="13" 
                    height="13" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    class="lucide lucide-star star-icon"
                  >
                    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
                  </svg>
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
                  Book Now — $${room.price}/night
                </button>

                <div class="booking-widget-terms">
                  <div class="booking-widget-term-item">
                    <svg 
                      xmlns="http://w3.org" 
                      width="13" 
                      height="13" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      stroke-width="2" 
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      class="lucide lucide-shield green-check"
                    >
                      <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/>
                    </svg>
                    <span>Free cancellation up to 48h before check-in</span>
                  </div>
                  <div class="booking-widget-term-item">
                    <svg 
                      xmlns="http://w3.org" 
                      width="13" 
                      height="13" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      stroke-width="2" 
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      class="lucide lucide-check-circle green-check"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <path d="m9 11 3 3L22 4" />
                    </svg>
                    <span>Instant confirmation</span>
                  </div>
                  <div class="booking-widget-term-item">
                    <svg 
                      xmlns="http://w3.org" 
                      width="13" 
                      height="13" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      stroke-width="2" 
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      class="lucide lucide-clock blue-clock"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Check-in 14:00 · Check-out 12:00</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        `;

    if (window.lucide) window.lucide.createIcons();

    // Bind interactive events
    const likeToggleBtn = container.querySelector("#like-toggle-btn");
    likeToggleBtn.addEventListener("click", () => {
      isLiked = !isLiked;
      const heartIcon = likeToggleBtn.querySelector("i");
      const textSpan = likeToggleBtn.querySelector("span");

      if (isLiked) {
        likeToggleBtn.classList.add("liked");
        heartIcon.classList.add("fill-red-500");
        textSpan.textContent = "Saved";
      } else {
        likeToggleBtn.classList.remove("liked");
        heartIcon.classList.remove("fill-red-500");
        textSpan.textContent = "Save";
      }
    });

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

  // Setup Mobile Sticky Footer Sync
  mobilePriceText.textContent = `$${room.price}`;
  mobileStickyFooter.style.display = "flex";
  mobileBookBtn.addEventListener("click", () => {
    window.openBookingModal(room.id);
  });
});