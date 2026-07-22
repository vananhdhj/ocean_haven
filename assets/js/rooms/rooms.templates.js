// ** Rooms page HTML ** //
// Pure HTML-string builders for the rooms catalog page.
// No DOM access, no event binding — just data in, HTML string out.

const fmtVNDRooms = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

function renderFilterPanelHtml(filters, isMobile) {
    const allTypes = ["Standard", "Deluxe", "Family Suite", "Connecting Room"];
    const allFloors = [1, 2, 3];
    const allViews = ["Sea View", "City View", "Garden View"];
    const idSuffix = isMobile ? 'm' : 'd';

    return `
    <div class="filter-panel">
      <div class="flex items-center justify-between" style="border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
        <span class="font-bold text-foreground">Filters</span>
        <button type="button" class="text-xs text-primary font-bold hover:underline" id="clear-link-${idSuffix}">Clear all</button>
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
            <p>${fmtVNDRooms(filters.priceMin)}</p>
          </div>
          <span style="color: var(--muted-foreground);">—</span>
          <div class="price-input-box">
            <p>Max</p>
            <p>${fmtVNDRooms(filters.priceMax)}</p>
          </div>
        </div>
        <input type="range" min="1500000" max="7500000" step="250000" value="${filters.priceMax}" class="price-range-slider" id="price-slider-${idSuffix}">
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
}

function renderRoomCardHtml(room) {
    const viewVariant = room.view === "Sea View" ? "sea" : room.view === "Garden View" ? "garden" : "city";

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
            <span class="room-card-price">${fmtVNDRooms(room.price)}</span>
            <span class="room-card-price-period">/ night</span>
          </div>
          <button type="button" class="btn-primary-sm">View Room</button>
        </div>
      </div>
    </div>
  `;
}

function renderPaginationHtml(currentPage, totalPages) {
    if (totalPages <= 1) return '';

    let html = `<div class="pagination-container">`;

    html += `<button type="button" class="btn-pagination prev-page" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>`;

    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        html += `<button type="button" class="btn-pagination page-num ${activeClass}" data-page="${i}">${i}</button>`;
    }

    html += `<button type="button" class="btn-pagination next-page" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;
    html += `</div>`;
    
    return html;
}

window.RoomsTemplates = {
    renderFilterPanelHtml,
    renderRoomCardHtml,
    renderPaginationHtml,
};