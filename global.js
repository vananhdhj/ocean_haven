// Main shared JS logic for Ocean Haven Hotel

document.addEventListener("DOMContentLoaded", () => {
  // Initialize navigation behavior
  initNavbar();
});

// ─── Navbar Helpers ────────────────────────────────────────────────────────
function initNavbar() {
  const profileBtn = document.getElementById("profile-btn");
  if (profileBtn) {
    profileBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openProfileModal();
    });
  }

  const menuToggle = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      mobileNav.classList.toggle("open");
      const icon = menuToggle.querySelector("i");
      if (icon) {
        if (mobileNav.classList.contains("open")) {
          icon.setAttribute("data-lucide", "x");
        } else {
          icon.setAttribute("data-lucide", "menu");
        }
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // Hook up profile button on mobile menu
  const mobileProfileBtn = document.getElementById("mobile-profile-btn");
  if (mobileProfileBtn) {
    mobileProfileBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (mobileNav) mobileNav.classList.remove("open");
      openProfileModal();
    });
  }

  // Close mobile nav when clicking any link inside it
  if (mobileNav) {
    mobileNav.addEventListener("click", (e) => {
      if (e.target.tagName === "A" || e.target.closest("a")) {
        mobileNav.classList.remove("open");
        const icon = menuToggle ? menuToggle.querySelector("i") : null;
        if (icon) {
          icon.setAttribute("data-lucide", "menu");
          if (window.lucide) window.lucide.createIcons();
        }
      }
    });
  }

  // Mark active page in navigation
  const currentPath = window.location.pathname;
  const navBtns = document.querySelectorAll(".nav-btn, .mobile-nav-btn");
  navBtns.forEach(btn => {
    const href = btn.getAttribute("href");
    if (href && (currentPath.endsWith(href) || (currentPath === "/" && href === "index.php"))) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// ─── Search Bar Helper ──────────────────────────────────────────────────────
function initSearchBar(containerSelector, onSearch) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const searchState = window.HotelDb.getSearchState();

  // Setup HTML Structure for Search Bar
  container.innerHTML = `
    <div class="search-bar-container">
      <div class="search-bar-grid">
        <!-- Location 
        <div class="search-field">
          <div class="search-field-with-icon">
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
              class="lucide lucide-map-pin text-primary shrink-0"
            >
              <path d="M20 10c0 4.993-5.539 10.193-7.399 11.74a1 1 0 0 1-1.202 0C9.54 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <div class="min-w-0">
              <span class="field-label">Location</span>
              <p class="search-field-text">Ocean Haven Hotel, Da Nang</p>
            </div>
          </div>
        </div>-->
        <!-- Check-in -->
        <div class="search-field flex-1">
          <label for="check-in-input">Check-in</label>
          <input type="date" id="check-in-input" value="${searchState.checkIn}" min="${new Date().toISOString().split("T")[0]}">
        </div>
        <!-- Check-out -->
        <div class="search-field flex-1">
          <label for="check-out-input">Check-out</label>
          <input type="date" id="check-out-input" value="${searchState.checkOut}">
        </div>
        <!-- Guests Selection -->
        <div class="search-field flex-1" style="cursor: pointer;">
          <button type="button" class="guests-trigger text-left">
            <span class="field-label">Guests</span>
            <span class="search-field-text" id="guests-display-text">
              ${searchState.adults} adult${searchState.adults !== 1 ? "s" : ""}${searchState.kids > 0 ? `, ${searchState.kids} child${searchState.kids !== 1 ? "ren" : ""}` : ""}
            </span>
          </button>
          
          <!-- Popover Dropdown -->
          <div class="guests-dropdown hidden" id="guests-dropdown-popover">
            <div class="counter-row">
              <span class="counter-label">Adults</span>
              <div class="counter-controls">
                <button type="button" class="counter-btn" id="adults-minus" ${searchState.adults <= 1 ? "disabled" : ""}>
                  <svg 
                    xmlns="http://w3.org" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    class="lucide lucide-minus"
                  >
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span class="counter-value" id="adults-val">${searchState.adults}</span>
                <button type="button" class="counter-btn" id="adults-plus">
                  <svg 
                    xmlns="http://w3.org" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    class="lucide lucide-plus"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="counter-row">
              <span class="counter-label">Children</span>
              <div class="counter-controls">
                <button type="button" class="counter-btn" id="kids-minus" ${searchState.kids <= 0 ? "disabled" : ""}>
                  <svg 
                    xmlns="http://w3.org" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    class="lucide lucide-minus"
                  >
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span class="counter-value" id="kids-val">${searchState.kids}</span>
                <button type="button" class="counter-btn" id="kids-plus">
                  <svg 
                    xmlns="http://w3.org" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    class="lucide lucide-plus"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </button>
              </div>
            </div>
            <button type="button" class="guests-done-btn" id="guests-done-btn">Done</button>
          </div>
        </div>
        <!-- Search Button -->
        <button type="button" class="search-submit-btn" id="search-btn">
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
            class="lucide lucide-search"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span>Search</span>
        </button>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const checkInInput = container.querySelector("#check-in-input");
  const checkOutInput = container.querySelector("#check-out-input");
  const guestsTrigger = container.querySelector(".guests-trigger");
  const guestsDropdown = container.querySelector("#guests-dropdown-popover");
  const guestsDoneBtn = container.querySelector("#guests-done-btn");
  const adultsVal = container.querySelector("#adults-val");
  const kidsVal = container.querySelector("#kids-val");
  const adultsMinus = container.querySelector("#adults-minus");
  const adultsPlus = container.querySelector("#adults-plus");
  const kidsMinus = container.querySelector("#kids-minus");
  const kidsPlus = container.querySelector("#kids-plus");
  const guestsDisplayText = container.querySelector("#guests-display-text");
  const searchBtn = container.querySelector("#search-btn");

  let localAdults = searchState.adults;
  let localKids = searchState.kids;

  // Sync date changes
  checkInInput.addEventListener("change", (e) => {
    const val = e.target.value;
    checkOutInput.min = val;
    if (new Date(checkOutInput.value) <= new Date(val)) {
      const checkInDate = new Date(val);
      checkInDate.setDate(checkInDate.getDate() + 3);
      checkOutInput.value = checkInDate.toISOString().split("T")[0];
    }
  });

  // Dropdown toggles
  guestsTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    guestsDropdown.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!guestsDropdown.contains(e.target) && !guestsTrigger.contains(e.target)) {
      guestsDropdown.classList.add("hidden");
    }
  });

  guestsDoneBtn.addEventListener("click", () => {
    guestsDropdown.classList.add("hidden");
  });

  // Guest Counter Updates
  const updateGuestsDisplay = () => {
    adultsVal.textContent = localAdults;
    kidsVal.textContent = localKids;

    adultsMinus.disabled = localAdults <= 1;
    adultsPlus.disabled = localAdults >= 8;
    kidsMinus.disabled = localKids <= 0;
    kidsPlus.disabled = localKids >= 6;

    guestsDisplayText.textContent = `${localAdults} adult${localAdults !== 1 ? "s" : ""}${localKids > 0 ? `, ${localKids} child${localKids !== 1 ? "ren" : ""}` : ""}`;
  };

  adultsMinus.addEventListener("click", (e) => {
    e.stopPropagation();
    if (localAdults > 1) {
      localAdults--;
      updateGuestsDisplay();
    }
  });

  adultsPlus.addEventListener("click", (e) => {
    e.stopPropagation();
    if (localAdults < 8) {
      localAdults++;
      updateGuestsDisplay();
    }
  });

  kidsMinus.addEventListener("click", (e) => {
    e.stopPropagation();
    if (localKids > 0) {
      localKids--;
      updateGuestsDisplay();
    }
  });

  kidsPlus.addEventListener("click", (e) => {
    e.stopPropagation();
    if (localKids < 6) {
      localKids++;
      updateGuestsDisplay();
    }
  });

  // Trigger search action
  searchBtn.addEventListener("click", () => {
    const searchData = {
      checkIn: checkInInput.value,
      checkOut: checkOutInput.value,
      adults: localAdults,
      kids: localKids
    };
    window.HotelDb.saveSearchState(searchData);
    if (onSearch) {
      onSearch(searchData);
    } else {
      window.location.href = "rooms.php";
    }
  });
}

// ─── User Profile Modal ──────────────────────────────────────────────────────
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

  dialog.innerHTML = `
    <div class="modal-header">
      <h2>My Account</h2>
      <button class="modal-close-btn" id="close-profile-modal-btn">
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
          class="lucide lucide-x"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
    
    <div class="modal-tabs">
      <button type="button" class="tab-btn ${activeProfileTab === "profile" ? "active" : ""}" id="tab-profile-btn">My Profile</button>
      <button type="button" class="tab-btn ${activeProfileTab === "bookings" ? "active" : ""}" id="tab-bookings-btn">My Bookings (${bookings.length})</button>
    </div>
    
    <div class="modal-body">
      <div id="profile-tab-content" class="${activeProfileTab === "profile" ? "" : "hidden"}">
        <div class="profile-avatar-row">
          <div class="avatar-large">
            <span>${profile.avatar}</span>
            <button class="avatar-edit-btn">
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
                class="lucide lucide-camera"
              >
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </button>
          </div>
          <div>
            <h3 class="font-bold text-foreground text-lg">${profile.name}</h3>
            <p class="text-sm text-muted-foreground">Member since ${profile.joined}</p>
            <div class="flex items-center gap-2 mt-1 text-primary text-xs font-semibold">
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
              <span>${profile.tier}</span>
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
                class="lucide lucide-log-out"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
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

  // Profile Form submit
  const profileForm = dialog.querySelector("#profile-form");
  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(profileForm);
    const updatedProfile = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      avatar: formData.get("name").charAt(0).toUpperCase()
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

// ─── Booking Modal ───────────────────────────────────────────────────────────
function openBookingModal(roomId) {
  const room = window.HotelDb.getRoomById(roomId);
  if (!room) return;

  let dialog = document.getElementById("booking-modal");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "booking-modal";
    document.body.appendChild(dialog);
  }

  const searchState = window.HotelDb.getSearchState();
  const profile = window.HotelDb.getProfile();

  // Calculate nights
  let nights = 3;
  if (searchState.checkIn && searchState.checkOut) {
    const d = (new Date(searchState.checkOut).getTime() - new Date(searchState.checkIn).getTime()) / 86400000;
    nights = Math.max(1, Math.round(d));
  }

  const subtotal = room.price * nights;
  const taxes = Math.round(subtotal * 0.1);
  const total = subtotal + taxes;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const checkinLabel = formatDate(searchState.checkIn);
  const checkoutLabel = formatDate(searchState.checkOut);
  const totalGuests = searchState.adults + searchState.kids;

  const confirmId = `OH-2025-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  let currentStep = "summary";
  let formValues = {
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
    requests: ""
  };

  const renderContent = () => {
    if (currentStep === "summary") {
      dialog.innerHTML = `
        <div class="modal-header">
          <h2>Review Booking</h2>
          <button class="modal-close-btn" id="close-booking-btn">
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
              class="lucide lucide-x"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="space-y-5">
            <!-- Room info -->
            <div class="booking-summary-room">
              <img src="${room.image}" alt="${room.name}" class="booking-summary-img">
              <div>
                <h4 class="font-bold text-foreground text-sm">${room.name}</h4>
                <p class="text-xs text-muted-foreground">${room.type} · Floor ${room.floor} · ${room.view}</p>
                <div class="flex items-center gap-1 mt-1 text-xs">
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
                  <span class="font-bold">${room.rating}</span>
                </div>
              </div>
            </div>

            <!-- Dates -->
            <div class="booking-summary-dates">
              <div class="date-box">
                <p>Check-in</p>
                <p>${checkinLabel}</p>
              </div>
              <div class="date-box date-box-highlight">
                <p>Nights</p>
                <p>${nights}</p>
              </div>
              <div class="date-box">
                <p>Check-out</p>
                <p>${checkoutLabel}</p>
              </div>
            </div>

            <!-- Guests -->
            <div class="booking-summary-guests">
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
                class="lucide lucide-user text-primary"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>${searchState.adults} adult${searchState.adults !== 1 ? "s" : ""}${searchState.kids > 0 ? `, ${searchState.kids} child${searchState.kids !== 1 ? "ren" : ""}` : ""}</span>
            </div>

            <!-- Guest Form -->
            <form id="booking-details-form" class="space-y-3" style="text-align: left;">
              <h3 class="font-bold text-foreground text-base">Guest Information</h3>
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" class="form-control" name="name" value="${formValues.name}" required>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Phone</label>
                  <input type="text" class="form-control" name="phone" value="${formValues.phone}" required>
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" class="form-control" name="email" value="${formValues.email}" required>
                </div>
              </div>
              <div class="form-group">
                <label>Special Requests (optional)</label>
                <textarea class="form-control" name="requests" rows="2" placeholder="Early check-in, extra pillows, cot…">${formValues.requests}</textarea>
              </div>

              <!-- Price breakdown -->
              <div class="price-breakdown">
                <h3>Price Breakdown</h3>
                <div class="price-breakdown-row">
                  <span class="text-muted-foreground">$${room.price} × ${nights} nights</span>
                  <span class="font-medium">$${subtotal}</span>
                </div>
                <div class="price-breakdown-row">
                  <span class="text-muted-foreground">Taxes & fees (10%)</span>
                  <span class="font-medium">$${taxes}</span>
                </div>
                <div class="price-breakdown-total price-breakdown-row">
                  <span>Total</span>
                  <span>$${total}</span>
                </div>
              </div>

              <button type="submit" class="btn-block btn-primary">Proceed to Payment — $${total}</button>
            </form>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();

      const detailsForm = dialog.querySelector("#booking-details-form");
      detailsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = new FormData(detailsForm);
        formValues = {
          name: data.get("name"),
          phone: data.get("phone"),
          email: data.get("email"),
          requests: data.get("requests")
        };
        currentStep = "payment";
        renderContent();
      });

      dialog.querySelector("#close-booking-btn").addEventListener("click", () => dialog.close());
    } else if (currentStep === "payment") {
      dialog.innerHTML = `
        <div class="modal-header">
          <div class="modal-header-left">
            <button class="modal-close-btn" id="booking-back-btn">
              <svg
                xmlns="http://w3.org"
                width="16"
                height="16"
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
            <h2>Payment</h2>
          </div>
          <button class="modal-close-btn" id="close-booking-btn">
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
              class="lucide lucide-x"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="space-y-6">
            <div class="momo-banner">
              <div class="momo-logo">M</div>
              <h3 class="font-bold text-foreground text-lg mb-1">Thanh toán qua MoMo</h3>
              <p class="text-muted-foreground text-sm">Scan the QR code with your MoMo app</p>
            </div>

            <!-- QR code SVG Mock -->
            <div class="qr-box">
              <div class="qr-wrapper">
                <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="160" height="160" fill="white" />
                  <rect x="8" y="8" width="44" height="44" rx="4" fill="none" stroke="#6C5CE7" strokeWidth="4" />
                  <rect x="16" y="16" width="28" height="28" rx="2" fill="#6C5CE7" />
                  <rect x="108" y="8" width="44" height="44" rx="4" fill="none" stroke="#6C5CE7" strokeWidth="4" />
                  <rect x="116" y="16" width="28" height="28" rx="2" fill="#6C5CE7" />
                  <rect x="8" y="108" width="44" height="44" rx="4" fill="none" stroke="#6C5CE7" strokeWidth="4" />
                  <rect x="16" y="116" width="28" height="28" rx="2" fill="#6C5CE7" />
                  <rect x="66" y="8" width="6" height="6" rx="1" fill="#6C5CE7" /><rect x="74" y="8" width="6" height="6" rx="1" fill="#6C5CE7" /><rect x="82" y="8" width="6" height="6" rx="1" fill="#6C5CE7" />
                  <rect x="66" y="24" width="6" height="6" rx="1" fill="#6C5CE7" /><rect x="66" y="40" width="6" height="6" rx="1" fill="#6C5CE7" />
                  <rect x="66" y="66" width="6" height="6" rx="1" fill="#6C5CE7" /><rect x="74" y="66" width="6" height="6" rx="1" fill="#6C5CE7" />
                  <rect x="108" y="66" width="6" height="6" rx="1" fill="#6C5CE7" /><rect x="116" y="66" width="6" height="6" rx="1" fill="#6C5CE7" />
                  <rect x="66" y="108" width="6" height="6" rx="1" fill="#6C5CE7" /><rect x="82" y="108" width="6" height="6" rx="1" fill="#6C5CE7" />
                  <rect x="66" y="124" width="6" height="6" rx="1" fill="#6C5CE7" /><rect x="90" y="124" width="6" height="6" rx="1" fill="#6C5CE7" />
                </svg>
              </div>
            </div>

            <div class="price-input-box" style="padding: 0.75rem 1rem; border-radius: var(--radius-lg); background-color: var(--secondary);">
              <p class="text-xs text-muted-foreground mb-1">Total amount</p>
              <p class="text-3xl font-bold text-foreground">$${total} <span class="text-sm font-normal text-muted-foreground">USD</span></p>
              <p class="text-xs text-muted-foreground mt-1">≈ ${(total * 25000).toLocaleString("vi-VN")} VNĐ</p>
            </div>

            <div class="space-y-2">
              <button type="button" class="btn-block momo-color-btn" id="momo-completed-btn">Transfer Completed</button>
              <button type="button" class="btn-block momo-outline-btn">Open MoMo App</button>
            </div>

            <p class="text-center text-xs text-muted-foreground">Transaction reference: <span class="font-mono font-bold text-foreground">OH-PAY-${Date.now().toString().slice(-6)}</span></p>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();

      dialog.querySelector("#booking-back-btn").addEventListener("click", () => {
        currentStep = "summary";
        renderContent();
      });

      dialog.querySelector("#momo-completed-btn").addEventListener("click", () => {
        // Add booking to database
        const newBooking = {
          id: confirmId,
          room: room.name,
          roomId: room.id,
          dates: `${checkinLabel.split(",")[0]} – ${checkoutLabel.split(",")[0]}, 2025`,
          status: "Confirmed",
          total: total,
          bookedOn: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          guests: totalGuests
        };
        window.HotelDb.addBooking(newBooking);

        currentStep = "success";
        renderContent();
      });

      dialog.querySelector("#close-booking-btn").addEventListener("click", () => dialog.close());
    } else if (currentStep === "success") {
      dialog.innerHTML = `
        <div class="modal-header">
          <h2 style="text-align: center; width: 100%;">Booking Confirmed!</h2>
        </div>
        <div class="modal-body text-center">
          <div class="space-y-5 py-4">
            <div class="success-icon-box">
              <svg
                xmlns="http://w3.org"
                width="44"
                height="44"
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
            </div>
            <div>
              <h3 class="text-2xl font-bold text-foreground mb-2">All Set!</h3>
              <p class="text-muted-foreground text-sm">Your reservation at Ocean Haven Hotel is confirmed.</p>
            </div>

            <div class="booking-confirm-card">
              <div class="booking-confirm-row">
                <span class="text-xs text-muted-foreground font-semibold uppercase">Booking ID</span>
                <span class="font-mono font-bold text-primary">${confirmId}</span>
              </div>
              <div class="booking-confirm-row">
                <span class="text-muted-foreground text-sm">Room</span>
                <span class="font-semibold text-foreground text-sm">${room.name}</span>
              </div>
              <div class="booking-confirm-row">
                <span class="text-muted-foreground text-sm">Dates</span>
                <span class="font-semibold text-foreground text-sm">${checkinLabel} → ${checkoutLabel}</span>
              </div>
              <div class="booking-confirm-row">
                <span class="text-muted-foreground text-sm">Guests</span>
                <span class="font-semibold text-foreground text-sm">${totalGuests} guest${totalGuests !== 1 ? "s" : ""}</span>
              </div>
              <div class="booking-confirm-row" style="border-top: 1px solid var(--border); padding-top: 0.625rem; font-weight: 700;">
                <span>Total Paid</span>
                <span class="text-primary">$${total}</span>
              </div>
            </div>

            <p class="text-xs text-muted-foreground">A confirmation email has been sent to <span class="text-foreground font-bold">${formValues.email}</span></p>

            <button type="button" class="btn-block btn-primary" id="success-done-btn">Back to Hotel</button>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();

      dialog.querySelector("#success-done-btn").addEventListener("click", () => {
        dialog.close();
        window.location.reload();
      });
    }
  };

  renderContent();
  dialog.showModal();
}

window.openBookingModal = openBookingModal;
window.openProfileModal = openProfileModal;
window.initSearchBar = initSearchBar;
