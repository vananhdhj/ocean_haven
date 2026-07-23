// ** Home page ** //
import { initSearchBar } from './search-bar.js';

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Search Bar
  initSearchBar("#hero-search-bar-container", () => {
    window.location.href = "rooms.php";
  });

  // Render Featured Rooms
  try {
    const res = await fetch("api/get_rooms.php");
    const rooms = await res.json();
    const featuredRooms = rooms.filter(r => r.featured).slice(0, 6);
    const roomsGrid = document.getElementById("featured-rooms-grid");

    if (roomsGrid) {
      roomsGrid.innerHTML = featuredRooms.map(room => {
        const viewVariant = room.view === "Sea View" ? "sea" : room.view === "Garden View" ? "garden" : "city";

        let starsHtml = "";
        for (let i = 1; i <= 5; i++) {
          const isFilled = i <= Math.round(room.rating);
          starsHtml += `<i data-lucide="star" class="${isFilled ? 'star-icon' : 'star-icon-muted'}" style="width: 12px; height: 12px;"></i>`;
        }

        return `
              <div class="room-card" onclick="window.location.href='detail.php?id=${room.id}'">
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
                    <span>${room.rating}</span>
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
  } catch (err) {
    console.error("Error rendering featured rooms:", err);
  }
});