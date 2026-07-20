let activeProfileTab = 'profile';

async function openProfileModal() {
  let dialog = document.getElementById('profile-modal');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'profile-modal';
    document.body.appendChild(dialog);
  }

  await renderProfileModalContent(dialog);
  dialog.showModal();

  dialog.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width
    );
    if (!isInDialog) dialog.close();
  });
}

async function renderProfileModalContent(dialog) {
  // Fetch real profile from session API
  const profile = await window.HotelDb.getProfile();
  const bookings = await window.HotelDb.getBookings();

  // If not logged in, redirect to login
  if (!profile) {
    dialog.close();
    window.HotelDb.redirectToLogin(window.location.href);
    return;
  }

  const initial = (profile.name || 'U').charAt(0).toUpperCase();
  const avatarHtml = profile.avatar_url
    ? `<img src="${profile.avatar_url}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
    : `<span>${initial}</span>`;

  const isAdmin = profile.role === 'admin';

  dialog.innerHTML = `
    <div class="modal-header">
      <h2>My Account</h2>
      <button class="modal-close-btn" id="close-profile-modal-btn">
        <i data-lucide="x" style="width:18px;height:18px;"></i>
      </button>
    </div>

    <div class="modal-tabs">
      <button type="button" class="tab-btn ${activeProfileTab === 'profile' ? 'active' : ''}" id="tab-profile-btn">My Profile</button>
      <button type="button" class="tab-btn ${activeProfileTab === 'bookings' ? 'active' : ''}" id="tab-bookings-btn">My Bookings (${bookings.length})</button>
      ${isAdmin ? `<a href="/final_assigment/admin/index.php" class="tab-btn" style="background:var(--accent-light);color:var(--accent-foreground);">
                     <i data-lucide="shield" style="width:13px;height:13px;display:inline;vertical-align:middle;margin-right:4px;"></i>Admin
                   </a>` : ''}
    </div>

    <div class="modal-body">
      <!-- Profile Tab -->
      <div id="profile-tab-content" class="${activeProfileTab === 'profile' ? '' : 'hidden'}">
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

      <!-- Bookings Tab -->
      <div id="bookings-tab-content" class="${activeProfileTab === 'bookings' ? '' : 'hidden'}">
        <p class="text-sm text-muted-foreground mb-4">
          ${bookings.length} reservation${bookings.length !== 1 ? 's' : ''}
        </p>
        <div class="space-y-4" style="max-height:400px;overflow-y:auto;padding-right:2px;">
          ${bookings.length === 0
      ? `<p class="text-sm text-muted-foreground" style="text-align:center;padding:2rem 0;">No bookings yet.</p>`
      : bookings.map(b => {
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
                  </div>`;
      }).join('')
    }
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // ── Event Listeners ──────────────────────────────────────────────
  dialog.querySelector('#close-profile-modal-btn').addEventListener('click', () => dialog.close());

  // Tab switching
  const tabProfileBtn = dialog.querySelector('#tab-profile-btn');
  const tabBookingsBtn = dialog.querySelector('#tab-bookings-btn');
  const profileContent = dialog.querySelector('#profile-tab-content');
  const bookingsContent = dialog.querySelector('#bookings-tab-content');

  tabProfileBtn.addEventListener('click', () => {
    activeProfileTab = 'profile';
    tabProfileBtn.classList.add('active');
    tabBookingsBtn.classList.remove('active');
    profileContent.classList.remove('hidden');
    bookingsContent.classList.add('hidden');
  });

  tabBookingsBtn.addEventListener('click', () => {
    activeProfileTab = 'bookings';
    tabBookingsBtn.classList.add('active');
    tabProfileBtn.classList.remove('active');
    bookingsContent.classList.remove('hidden');
    profileContent.classList.add('hidden');
  });

  // Profile Form submit → real API
  const profileForm = dialog.querySelector('#profile-form');
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = dialog.querySelector('#save-profile-btn');
    saveBtn.textContent = 'Saving…';
    saveBtn.disabled = true;

    const formData = new FormData(profileForm);
    const result = await window.HotelDb.updateProfile({
      name: formData.get('name'),
      phone: formData.get('phone'),
    });

    if (result.success) {
      saveBtn.textContent = 'Saved ✓';
      await renderProfileModalContent(dialog); // re-render with fresh data
    } else {
      saveBtn.textContent = 'Save Changes';
      saveBtn.disabled = false;
      alert(result.message || 'Failed to save. Please try again.');
    }
  });

  // Sign Out → real logout
  const signOutBtn = dialog.querySelector('#sign-out-btn');
  signOutBtn.addEventListener('click', () => {
    dialog.close();
    window.location.href = '/final_assigment/auth/logout.php';
  });

  // Cancel Booking buttons
  const cancelBtns = dialog.querySelectorAll('.cancel-booking-link-btn');
  cancelBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const bookingId = btn.getAttribute('data-booking-id');
      if (confirm(`Are you sure you want to cancel booking ${bookingId}?`)) {
        const success = await window.HotelDb.cancelBooking(bookingId);
        if (success) {
          await renderProfileModalContent(dialog);
        }
      }
    });
  });

  // ── Avatar upload ────────────────────────────────────────────────────
  const avatarArea = dialog.querySelector('#avatar-upload-area');
  const avatarOverlay = dialog.querySelector('#avatar-upload-overlay');
  const avatarInput = dialog.querySelector('#avatar-file-input');

  if (avatarArea && avatarInput) {
    // Hover: reveal camera overlay
    avatarArea.addEventListener('mouseenter', () => { avatarOverlay.style.opacity = '1'; });
    avatarArea.addEventListener('mouseleave', () => { avatarOverlay.style.opacity = '0'; });

    // Click / keyboard: open file picker
    avatarArea.addEventListener('click', () => avatarInput.click());
    avatarArea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); avatarInput.click(); }
    });

    // File selected: resize via canvas → save to localStorage → update UI
    avatarInput.addEventListener('change', () => {
      const file = avatarInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const tempImg = new Image();
        tempImg.onload = () => {
          // Crop to square and resize to 200×200 to keep localStorage small
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 200;
          const ctx = canvas.getContext('2d');
          const size = Math.min(tempImg.width, tempImg.height);
          ctx.drawImage(tempImg,
            (tempImg.width - size) / 2, (tempImg.height - size) / 2,
            size, size, 0, 0, 200, 200);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

          // Persist in browser
          localStorage.setItem('ocean_haven_avatar', dataUrl);

          // Update avatar circle in modal immediately
          let avatarImg = avatarArea.querySelector('img');
          const initSpan = avatarArea.querySelector('span:not(#avatar-upload-overlay span)');
          const initIcon = avatarArea.querySelector('i:not(#avatar-upload-overlay i)'); // if using default icon

          if (!avatarImg) {
            avatarImg = document.createElement('img');
            avatarImg.alt = 'Avatar';
            avatarImg.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
            if (initSpan) initSpan.replaceWith(avatarImg);
            else if (initIcon) initIcon.replaceWith(avatarImg);
            else avatarArea.insertBefore(avatarImg, avatarOverlay);
          }
          avatarImg.src = dataUrl;

          // Update navbar button live
          if (typeof window.updateNavbarAvatar === 'function') {
            window.updateNavbarAvatar(dataUrl);
          }
        };
        tempImg.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
}

window.openProfileModal = openProfileModal;
