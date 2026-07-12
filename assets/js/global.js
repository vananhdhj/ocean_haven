// Main shared JS logic for Hotel website

// Lightweight replacement for window.HotelDb using localStorage (for profile/search/bookings caching) and fetch (for rooms)
(function() {
  const getStorage = (key, fallback) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  };

  const setStorage = (key, val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error(e);
    }
  };

  const DEFAULT_PROFILE = {
    name: "Nguyen Van An",
    email: "vanan@gmail.com",
    phone: "0901234567",
    avatar: ""
  };

  let roomsCache = [];
  fetch("api/get_rooms.php")
    .then(res => res.json())
    .then(data => { roomsCache = data; })
    .catch(err => console.error("Prefetch rooms failed:", err));

  window.HotelDb = {
    getRooms() {
      return roomsCache;
    },
    getRoomById(id) {
      let targetId = id;
      if (id !== null && id !== undefined && !isNaN(id)) {
        const num = parseInt(id);
        const padded = num.toString().padStart(3, '0');
        targetId = `room-${padded}`;
      }
      return roomsCache.find(r => r.id == targetId || r.id == id);
    },
    getProfile() {
      return getStorage("oh_profile", DEFAULT_PROFILE);
    },
    updateProfile(profileData) {
      const current = this.getProfile();
      const updated = { ...current, ...profileData };
      setStorage("oh_profile", updated);
      return updated;
    },
    getBookings() {
      return getStorage("oh_bookings", []);
    },
    addBooking(booking) {
      const bookings = this.getBookings();
      bookings.unshift(booking);
      setStorage("oh_bookings", bookings);
      return bookings;
    },
    cancelBooking(id) {
      const bookings = this.getBookings();
      const idx = bookings.findIndex(b => b.id === id);
      if (idx !== -1) {
        bookings[idx].status = "Cancelled";
        setStorage("oh_bookings", bookings);
      }
      return bookings;
    },
    getSearchState() {
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0];
      return getStorage("oh_search", {
        checkIn: today,
        checkOut: tomorrow
      });
    },
    saveSearchState(searchState) {
      setStorage("oh_search", searchState);
    }
  };
})();
