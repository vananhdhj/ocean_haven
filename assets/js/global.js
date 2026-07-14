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
    async getBookings() {
      const profile = this.getProfile();
      if (!profile || !profile.email) {
        return [];
      }
      try {
        const response = await fetch(`./api/get_bookings.php?email=${encodeURIComponent(profile.email)}`);
        if (!response.ok) throw new Error("Failed to fetch bookings");
        const dbBookings = await response.json();
        
        const formatDate = (dateStr) => {
          if (!dateStr) return "";
          return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        };

        return dbBookings.map(b => {
          const checkInFriendly = formatDate(b.check_in);
          const checkOutFriendly = formatDate(b.check_out);
          return {
            id: b.booking_code, // Friendly code to display as Booking ID
            room: b.room,
            dates: `${checkInFriendly} → ${checkOutFriendly}`,
            guests: b.guests,
            status: b.status,
            bookedOn: formatDate(b.bookedOn),
            total: b.total
          };
        });
      } catch (err) {
        console.error("Fetch bookings failed:", err);
        return [];
      }
    },
    addBooking(booking) {
      const bookings = getStorage("oh_bookings", []);
      bookings.unshift(booking);
      setStorage("oh_bookings", bookings);
      return bookings;
    },
    async cancelBooking(id) {
      try {
        const response = await fetch("./api/cancel_booking.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking_id: id })
        });
        const result = await response.json();
        if (!result.success) {
          alert(result.message || "Failed to cancel booking.");
        }
        return result.success;
      } catch (err) {
        console.error("Cancel booking error:", err);
        alert("Lỗi kết nối mạng khi hủy đặt phòng.");
        return false;
      }
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
