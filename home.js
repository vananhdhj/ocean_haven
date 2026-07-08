document.addEventListener("DOMContentLoaded", () => {
  // Initialize Search Bar
  initSearchBar("#hero-search-bar-container", (searchData) => {
    // Search callback
    window.location.href = "rooms.html";
  });

  // Render Featured Rooms
  const featuredRooms = window.HotelDb.getRooms().filter(r => r.featured).slice(0, 6);
  const roomsGrid = document.getElementById("featured-rooms-grid");

  if (roomsGrid) {
    roomsGrid.innerHTML = featuredRooms.map(room => {
      const viewVariant = room.view === "Sea View" ? "sea" : room.view === "Garden View" ? "garden" : "city";

      // Generate Stars
      let starsHtml = "";
      for (let i = 1; i <= 5; i++) {
        const isFilled = i <= Math.round(room.rating);
        starsHtml += `<svg 
                        xmlns="http://w3.org" 
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-star ${isFilled ? 'star-icon' : 'star-icon-muted'}">
                          <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
                      </svg>`;
      }

      return `
            <div class="room-card" onclick="window.location.href='detail.html?id=${room.id}'">
              <div class="room-card-img-wrapper">
                <img src="${room.image}" alt="${room.name}" class="room-card-img">
                <div class="room-card-badges">
                  <span class="badge badge-type">${room.type}</span>
                  <span class="badge badge-${viewVariant}">${room.view}</span>
                </div>
                <div class="room-card-rating-badge">
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
                    class="lucide lucide-star star-icon"
                  >
                    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
                  </svg>
                  <span>${room.rating}</span>
                </div>
              </div>
              <div class="room-card-body">
                <h3 class="room-card-title">${room.name}</h3>
                <div class="room-card-specs">
                  <div class="room-card-spec-item">
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
                      class="lucide lucide-bed-double"
                    >                  
                      <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/>
                      <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/>
                      <path d="M12 4v6"/>
                      <path d="M2 18h20"/>
                    </svg>
                    <span>${room.beds} ${room.bedType}</span>
                  </div>
                  <div class="room-card-spec-item">
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
                      class="lucide lucide-eye"
                    >
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
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
                    <span class="room-card-price">$${room.price}</span>
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
});