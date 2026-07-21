// ** Profile modal HTML ** //
// Pure HTML-string builders for the profile modal. No DOM access, no event binding.

function renderModalHeader() {
    return `
    <div class="modal-header">
      <h2>My Account</h2>
      <button class="modal-close-btn" id="close-profile-modal-btn">
        <i data-lucide="x" style="width:18px;height:18px;"></i>
      </button>
    </div>
  `;
}

function renderModalTabs(activeTab, bookingsCount, isAdmin) {
    return `
    <div class="modal-tabs">
      <button type="button" class="tab-btn ${activeTab === 'profile' ? 'active' : ''}" id="tab-profile-btn">My Profile</button>
      <button type="button" class="tab-btn ${activeTab === 'bookings' ? 'active' : ''}" id="tab-bookings-btn">My Bookings (${bookingsCount})</button>
      ${isAdmin ? `<a href="/final_assigment/admin/index.php" class="tab-btn" style="background:var(--accent-light);color:var(--accent-foreground);">
                     <i data-lucide="shield" style="width:13px;height:13px;display:inline;vertical-align:middle;margin-right:4px;"></i>Admin
                   </a>` : ''}
    </div>
  `;
}

function renderProfileTab({ profile, isAdmin, activeTab, avatarHtml }) {
    return `
    <div id="profile-tab-content" class="${activeTab === 'profile' ? '' : 'hidden'}">
      <div class="profile-avatar-row">
        <div class="avatar-large avatar-upload-trigger" id="avatar-upload-area"
             tabindex="0" role="button" aria-label="Change profile picture"
             style="position:relative;cursor:pointer;display:flex;align-items:center;justify-content:center;overflow:hidden;">
          ${avatarHtml}
          <div id="avatar-upload-overlay" style="
            position:absolute;inset:0;
            background:rgba(0,0,0,0.50);
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            opacity:0;transition:opacity 0.2s ease;
            border-radius:50%;
            color:#fff;font-size:0.65rem;font-weight:600;gap:3px;
            pointer-events:none;
          ">
            <i data-lucide="camera" style="width:18px;height:18px;"></i>
            <span>Change</span>
          </div>
        </div>

        <input type="file" id="avatar-file-input"
               accept="image/jpeg,image/png,image/gif,image/webp"
               style="display:none;">
        <div>
          <h3 class="font-bold text-foreground text-lg">${profile.name}</h3>
          <p class="text-sm text-muted-foreground">Member since ${profile.joined || new Date().getFullYear()}</p>
          <div class="flex items-center gap-2 mt-1 text-xs font-semibold" style="color:var(--primary-light);">
            <i data-lucide="${isAdmin ? 'shield' : 'star'}" class="star-icon" style="width:13px;height:13px;"></i>
            <span>${isAdmin ? 'Hotel Staff' : 'Silver'}</span>
          </div>
        </div>
      </div>

      <form id="profile-form" class="space-y-4">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" class="form-control" name="name" value="${profile.name}" required>
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="text" class="form-control" name="phone" value="${profile.phone}" required>
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" class="form-control" name="email" value="${profile.email}" disabled
                 style="opacity:0.6;cursor:not-allowed;" title="Email cannot be changed">
          <p style="font-size:0.75rem;color:var(--muted-foreground);margin-top:0.25rem;">Email cannot be changed after registration.</p>
        </div>

        <div class="profile-form-actions">
          <button type="submit" class="btn-block btn-primary" id="save-profile-btn">Save Changes</button>
          <button type="button" class="btn-outline-red" id="sign-out-btn">
            <i data-lucide="log-out" style="width:15px;height:15px;"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </form>
    </div>
  `;
}

function renderBookingCard(b) {
    let statusClass = 'status-confirmed';
    if (b.status === 'Completed') statusClass = 'status-completed';
    if (b.status === 'Cancelled') statusClass = 'status-cancelled';

    return `
    <div class="booking-item-card">
      <div class="booking-item-header">
        <div>
          <h4 class="font-bold text-foreground" style="font-size:0.9375rem;">${b.room}</h4>
          <p class="text-xs text-muted-foreground mt-0.5">${b.dates} · ${b.guests} guest${b.guests !== 1 ? 's' : ''}</p>
        </div>
        <span class="booking-status ${statusClass}">${b.status}</span>
      </div>
      <div class="booking-item-details">
        <div class="space-y-0.5">
          <p>Booking ID: <span class="font-mono font-bold text-foreground">${b.id}</span></p>
          <p>Booked on ${b.bookedOn}</p>
        </div>
        <span class="booking-item-price">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(b.total)}</span>
      </div>
      ${b.status === 'Confirmed'
            ? `<button type="button" class="cancel-booking-link-btn" data-booking-id="${b.id}">Cancel Reservation</button>`
            : ''}
    </div>
  `;
}

function renderBookingsTab({ bookings, activeTab }) {
    const listHtml = bookings.length === 0
        ? `<p class="text-sm text-muted-foreground" style="text-align:center;padding:2rem 0;">No bookings yet.</p>`
        : bookings.map(renderBookingCard).join('');

    return `
    <div id="bookings-tab-content" class="${activeTab === 'bookings' ? '' : 'hidden'}">
      <p class="text-sm text-muted-foreground mb-4">
        ${bookings.length} reservation${bookings.length !== 1 ? 's' : ''}
      </p>
      <div class="space-y-4" style="max-height:400px;overflow-y:auto;padding-right:2px;">
        ${listHtml}
      </div>
    </div>
  `;
}

/** Builds the full modal innerHTML. */
function renderProfileModalHtml({ profile, bookings, activeTab, avatarHtml }) {
    const isAdmin = profile.role === 'admin';
    return `
    ${renderModalHeader()}
    ${renderModalTabs(activeTab, bookings.length, isAdmin)}
    <div class="modal-body">
      ${renderProfileTab({ profile, isAdmin, activeTab, avatarHtml })}
      ${renderBookingsTab({ bookings, activeTab })}
    </div>
  `;
}

window.ProfileModalTemplates = {
    renderProfileModalHtml,
};