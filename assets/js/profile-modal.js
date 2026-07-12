let activeProfileTab = "profile";

function openProfileModal() {
  // Check if dialog exists, else create it
  let dialog = document.getElementById("profile-modal");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "profile-modal";
    document.body.appendChild(dialog);
  }

  renderProfileModalContent(dialog);
  dialog.showModal();

  // Setup click outside to close
  dialog.addEventListener("click", (e) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
    if (!isInDialog) {
      dialog.close();
    }
  });
}

function renderProfileModalContent(dialog) {
  const profile = window.HotelDb.getProfile();
  const bookings = window.HotelDb.getBookings();

  const isImage = profile.avatar && (profile.avatar.startsWith("data:") || profile.avatar.startsWith("http"));
  const avatarInnerHtml = isImage 
    ? `<img src="${profile.avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
    : `<span>${profile.avatar || profile.name.charAt(0).toUpperCase()}</span>`;

  dialog.innerHTML = `
    <div class="modal-header">
      <h2>My Account</h2>
      <button class="modal-close-btn" id="close-profile-modal-btn">
        <i data-lucide="x" style="width: 18px; height: 18px;"></i>
      </button>
    </div>
    
    <div class="modal-tabs">
      <button type="button" class="tab-btn ${activeProfileTab === "profile" ? "active" : ""}" id="tab-profile-btn">My Profile</button>
      <button type="button" class="tab-btn ${activeProfileTab === "bookings" ? "active" : ""}" id="tab-bookings-btn">My Bookings (${bookings.length})</button>
    </div>
    
    <div class="modal-body">
      <div id="profile-tab-content" class="${activeProfileTab === "profile" ? "" : "hidden"}">
        <div class="profile-avatar-row">
          <div class="avatar-large" style="position: relative; display: flex; align-items: center; justify-content: center;">
            ${avatarInnerHtml}
            <button class="avatar-edit-btn" id="change-avatar-btn" style="z-index: 10;">
              <i data-lucide="camera" style="width: 13px; height: 13px;"></i>
            </button>
          </div>
          <div>
            <h3 class="font-bold text-foreground text-lg">${profile.name}</h3>
            <p class="text-sm text-muted-foreground">Member since ${profile.joined || '2025'}</p>
            <div class="flex items-center gap-2 mt-1 text-primary text-xs font-semibold">
              <i data-lucide="star" class="star-icon" style="width: 13px; height: 13px;"></i>
              <span>${profile.tier || 'Silver'}</span>
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
            <input type="email" class="form-control" name="email" value="${profile.email}" required>
          </div>
          
          <div class="profile-form-actions">
            <button type="submit" class="btn-block btn-primary">Save Changes</button>
            <button type="button" class="btn-outline-red" id="sign-out-btn">
              <i data-lucide="log-out" style="width: 15px; height: 15px;"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </form>
      </div>
      
      <div id="bookings-tab-content" class="${activeProfileTab === "bookings" ? "" : "hidden"}">
        <p class="text-sm text-muted-foreground mb-4">${bookings.length} reservation${bookings.length !== 1 ? "s" : ""}</p>
        <div class="space-y-4" style="max-height: 400px; overflow-y: auto; padding-right: 2px;">
          ${bookings.map(b => {
            let statusClass = "status-confirmed";
            if (b.status === "Completed") statusClass = "status-completed";
            if (b.status === "Cancelled") statusClass = "status-cancelled";

            return `
              <div class="booking-item-card">
                <div class="booking-item-header">
                  <div>
                    <h4 class="font-bold text-foreground" style="font-size: 0.9375rem;">${b.room}</h4>
                    <p class="text-xs text-muted-foreground mt-0.5">${b.dates} · ${b.guests} guest${b.guests !== 1 ? "s" : ""}</p>
                  </div>
                  <span class="booking-status ${statusClass}">${b.status}</span>
                </div>
                <div class="booking-item-details">
                  <div class="space-y-0.5">
                    <p>Booking ID: <span class="font-mono font-bold text-foreground">${b.id}</span></p>
                    <p>Booked on ${b.bookedOn}</p>
                  </div>
                  <span class="booking-item-price">$${b.total}</span>
                </div>
                ${b.status === "Confirmed" ? `<button type="button" class="cancel-booking-link-btn" data-booking-id="${b.id}">Cancel Reservation</button>` : ""}
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Attach Event Listeners inside modal
  const closeBtn = dialog.querySelector("#close-profile-modal-btn");
  closeBtn.addEventListener("click", () => dialog.close());

  // Tab switching
  const tabProfileBtn = dialog.querySelector("#tab-profile-btn");
  const tabBookingsBtn = dialog.querySelector("#tab-bookings-btn");
  const profileContent = dialog.querySelector("#profile-tab-content");
  const bookingsContent = dialog.querySelector("#bookings-tab-content");

  tabProfileBtn.addEventListener("click", () => {
    activeProfileTab = "profile";
    tabProfileBtn.classList.add("active");
    tabBookingsBtn.classList.remove("active");
    profileContent.classList.remove("hidden");
    bookingsContent.classList.add("hidden");
  });

  tabBookingsBtn.addEventListener("click", () => {
    activeProfileTab = "bookings";
    tabBookingsBtn.classList.add("active");
    tabProfileBtn.classList.remove("active");
    bookingsContent.classList.remove("hidden");
    profileContent.classList.add("hidden");
  });

  // Change Avatar Action
  const changeAvatarBtn = dialog.querySelector("#change-avatar-btn");
  if (changeAvatarBtn) {
    changeAvatarBtn.addEventListener("click", () => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const updatedProfile = {
              ...profile,
              avatar: reader.result
            };
            window.HotelDb.updateProfile(updatedProfile);
            renderProfileModalContent(dialog);
          };
          reader.readAsDataURL(file);
        }
      });
      fileInput.click();
    });
  }

  // Profile Form submit
  const profileForm = dialog.querySelector("#profile-form");
  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(profileForm);
    const currentProfile = window.HotelDb.getProfile();
    const updatedProfile = {
      ...profile,
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      avatar: currentProfile.avatar || formData.get("name").charAt(0).toUpperCase()
    };
    window.HotelDb.updateProfile(updatedProfile);

    // Update navbar avatar if exists
    const navAvatarSpan = document.querySelector("#profile-btn span");
    if (navAvatarSpan) navAvatarSpan.textContent = updatedProfile.avatar;

    alert("Profile saved successfully!");
    renderProfileModalContent(dialog);
  });

  // Sign out click
  const signOutBtn = dialog.querySelector("#sign-out-btn");
  signOutBtn.addEventListener("click", () => {
    alert("You have signed out (dummy action).");
    dialog.close();
  });

  // Cancel Booking action
  const cancelBtns = dialog.querySelectorAll(".cancel-booking-link-btn");
  cancelBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const bookingId = btn.getAttribute("data-booking-id");
      if (confirm(`Are you sure you want to cancel booking ${bookingId}?`)) {
        window.HotelDb.cancelBooking(bookingId);
        renderProfileModalContent(dialog);
      }
    });
  });
}

window.openProfileModal = openProfileModal;
