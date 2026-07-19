// global.js — Shared JS for Ocean Haven Hotel
// Profile data and auth state come from the real PHP session via API calls.
// All localStorage mock data has been removed.

(function () {

  // ── In-memory cache for the current page lifetime ──────────────
  let _profileCache  = null;
  let _profileFetched = false;

  let roomsCache = [];

  // Pre-fetch rooms (public, no auth required)
  fetch('./api/get_rooms.php')
    .then(res => res.json())
    .then(data => { roomsCache = data; })
    .catch(err => console.error('Prefetch rooms failed:', err));

  // ── Search state (still stored in sessionStorage, not auth-sensitive) ──
  const getStorage = (key, fallback) => {
    try {
      const val = sessionStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  };
  const setStorage = (key, val) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error(e);
    }
  };

  // ── Public API ──────────────────────────────────────────────────
  window.HotelDb = {

    // ── Rooms ─────────────────────────────────────────────────────
    getRooms() {
      return roomsCache;
    },

    getRoomById(id) {
      let targetId = id;
      if (id !== null && id !== undefined && !isNaN(id)) {
        const num    = parseInt(id);
        const padded = num.toString().padStart(3, '0');
        targetId = `room-${padded}`;
      }
      return roomsCache.find(r => r.id == targetId || r.id == id);
    },

    // ── Profile (from session via API) ────────────────────────────
    async getProfile() {
      if (_profileFetched) return _profileCache;
      try {
        const res = await fetch('./api/get_profile.php');
        if (res.status === 401) {
          // Not logged in
          _profileCache  = null;
          _profileFetched = true;
          return null;
        }
        _profileCache   = await res.json();
        _profileFetched = true;
        return _profileCache;
      } catch (err) {
        console.error('getProfile failed:', err);
        return null;
      }
    },

    async updateProfile(profileData) {
      try {
        const res = await fetch('./api/update_profile.php', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(profileData),
        });
        const result = await res.json();
        if (result.success) {
          // Invalidate cache so next call re-fetches
          _profileFetched = false;
          _profileCache   = null;
        }
        return result;
      } catch (err) {
        console.error('updateProfile failed:', err);
        return { success: false, message: 'Network error.' };
      }
    },

    // ── Bookings ──────────────────────────────────────────────────
    async getBookings() {
      try {
        const response = await fetch('./api/get_bookings.php');
        if (response.status === 401) return [];     // Not logged in
        if (!response.ok) throw new Error('Failed to fetch bookings');

        const dbBookings = await response.json();

        const formatDate = (dateStr) => {
          if (!dateStr) return '';
          return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
          });
        };

        return dbBookings.map(b => ({
          id:       b.booking_code,   // Friendly code shown as Booking ID
          room:     b.room,
          dates:    `${formatDate(b.check_in)} → ${formatDate(b.check_out)}`,
          guests:   b.guests,
          status:   b.status,
          bookedOn: formatDate(b.bookedOn),
          total:    b.total,
        }));
      } catch (err) {
        console.error('Fetch bookings failed:', err);
        return [];
      }
    },

    async cancelBooking(bookingCode) {
      try {
        const response = await fetch('./api/cancel_booking.php', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ booking_id: bookingCode }),
        });
        const result = await response.json();
        if (!result.success) {
          alert(result.message || 'Failed to cancel booking.');
        }
        return result.success;
      } catch (err) {
        console.error('Cancel booking error:', err);
        alert('Network error when cancelling booking.');
        return false;
      }
    },

    // ── Search state (non-sensitive, kept in sessionStorage) ──────
    getSearchState() {
      const today    = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
      return getStorage('oh_search', { checkIn: today, checkOut: tomorrow });
    },

    saveSearchState(searchState) {
      setStorage('oh_search', searchState);
    },

    // ── Auth helpers ──────────────────────────────────────────────
    redirectToLogin(returnUrl) {
      const loginModal = document.getElementById('login-modal');
      if (loginModal) {
        loginModal.showModal();
      } else {
        const next = encodeURIComponent(returnUrl || window.location.pathname + window.location.search);
        window.location.href = `/final_assigment/auth/login.php?next=${next}`;
      }
    },
  };

})();
