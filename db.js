// Dummy database for Ocean Haven Hotel

const DEFAULT_ROOMS = [
  // Floor 1
  {
    id: 1,
    name: "Ocean Breeze Standard",
    type: "Standard",
    floor: 1,
    view: "Sea View",
    price: 89,
    rating: 4.7,
    reviewCount: 124,
    maxGuests: 2,
    beds: 1,
    bedType: "Queen",
    size: 28,
    image: "https://images.unsplash.com/photo-1776876648949-63ccabf63b10?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1776876648949-63ccabf63b10?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1696854649609-1fd6e5abf87f?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1775566081059-6e35805e4edd?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "Wake up to the gentle sound of waves in this beautifully appointed standard room. Floor-to-ceiling windows frame a captivating sea panorama, while warm tones create a serene sanctuary. Each morning begins with golden light spilling across the ocean surface, visible from your bed.",
    amenities: ["Free WiFi", "Air Conditioning", "Flat-screen TV", "Mini Bar", "Room Service", "Sea View", "En-suite Bathroom"],
    featured: true
  },
  {
    id: 2,
    name: "Garden Serenity Standard",
    type: "Standard",
    floor: 1,
    view: "Garden View",
    price: 79,
    rating: 4.5,
    reviewCount: 89,
    maxGuests: 2,
    beds: 1,
    bedType: "Double",
    size: 26,
    image: "https://images.unsplash.com/photo-1695706807850-8c66b24b3413?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1695706807850-8c66b24b3413?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1637730827702-de34e9ae4ede?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "A tranquil retreat overlooking our lush tropical garden. The soft rustling of palms and fragrant blooms create a natural backdrop for your perfect getaway. Cool breezes drift through the jalousie windows every evening.",
    amenities: ["Free WiFi", "Air Conditioning", "Flat-screen TV", "Coffee Maker", "Garden View", "En-suite Bathroom"]
  },
  {
    id: 3,
    name: "Twin Comfort Standard",
    type: "Standard",
    floor: 1,
    view: "City View",
    price: 75,
    rating: 4.3,
    reviewCount: 67,
    maxGuests: 2,
    beds: 2,
    bedType: "Twin",
    size: 26,
    image: "https://images.unsplash.com/photo-1637730827702-de34e9ae4ede?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1637730827702-de34e9ae4ede?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "Perfect for colleagues or friends, this twin room offers two comfortable beds and city views. Clean, modern, and thoughtfully designed for the practical traveler who values space and quality.",
    amenities: ["Free WiFi", "Air Conditioning", "Flat-screen TV", "Work Desk", "City View", "En-suite Bathroom"]
  },
  {
    id: 4,
    name: "Coastal Family Suite",
    type: "Family Suite",
    floor: 1,
    view: "Sea View",
    price: 189,
    rating: 4.9,
    reviewCount: 201,
    maxGuests: 5,
    beds: 2,
    bedType: "King + Bunk",
    size: 58,
    image: "https://images.unsplash.com/photo-1702830499141-a0634d87d6af?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1702830499141-a0634d87d6af?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1776876648949-63ccabf63b10?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1693098243367-93320637839e?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "The ultimate family retreat. A spacious suite with a master bedroom, separate children's area with bunk beds, and a generous living space. Step onto your private balcony for breathtaking ocean views. Children love it; parents never want to leave.",
    amenities: ["Free WiFi", "Air Conditioning", "2 Flat-screen TVs", "Full Kitchen", "Balcony", "Sea View", "2 Bathrooms", "Children's amenities", "Laundry"],
    featured: true
  },
  {
    id: 5,
    name: "Garden Family Room",
    type: "Family Suite",
    floor: 1,
    view: "Garden View",
    price: 169,
    rating: 4.7,
    reviewCount: 145,
    maxGuests: 4,
    beds: 2,
    bedType: "Queen + Twin",
    size: 52,
    image: "https://images.unsplash.com/photo-1689717887631-088197cdc2ca?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1689717887631-088197cdc2ca?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "Nestled beside our tropical garden, this family suite offers generous space for up to four guests. Children will love watching exotic birds from the private patio each morning.",
    amenities: ["Free WiFi", "Air Conditioning", "2 Flat-screen TVs", "Kitchenette", "Private Patio", "Garden View", "2 Bathrooms"]
  },
  {
    id: 6,
    name: "Palm Grove Standard",
    type: "Standard",
    floor: 1,
    view: "Garden View",
    price: 82,
    rating: 4.4,
    reviewCount: 78,
    maxGuests: 2,
    beds: 1,
    bedType: "Queen",
    size: 28,
    image: "https://images.unsplash.com/photo-1609602126247-4ab7188b4aa1?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1609602126247-4ab7188b4aa1?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "Cozy and comfortable, this garden-facing standard room offers a peaceful retreat with a private seating area among the palms. The perfect room for guests who value quiet above all else.",
    amenities: ["Free WiFi", "Air Conditioning", "Flat-screen TV", "Coffee Maker", "Garden View", "En-suite Bathroom"]
  },
  {
    id: 7,
    name: "Seaside Connecting Suite",
    type: "Connecting Room",
    floor: 1,
    view: "Sea View",
    price: 159,
    rating: 4.6,
    reviewCount: 93,
    maxGuests: 4,
    beds: 2,
    bedType: "King + Queen",
    size: 48,
    image: "https://images.unsplash.com/photo-1776761603930-e4509e386fbf?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1776761603930-e4509e386fbf?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "Two connected rooms, one key. Perfect for multigenerational families, the Seaside Connecting gives adults and children their own space while staying close.",
    amenities: ["Free WiFi", "Air Conditioning", "2 Flat-screen TVs", "Mini Bar", "Sea View", "Connecting Door", "2 Bathrooms"],
    featured: true
  },
  {
    id: 8,
    name: "City View Standard",
    type: "Standard",
    floor: 1,
    view: "City View",
    price: 72,
    rating: 4.2,
    reviewCount: 55,
    maxGuests: 2,
    beds: 1,
    bedType: "Double",
    size: 24,
    image: "https://images.unsplash.com/photo-1664189767954-e4e605ae46da?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1664189767954-e4e605ae46da?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "A practical and comfortable standard room with city views. Ideal for the solo traveler or business couple seeking good value in a prime location.",
    amenities: ["Free WiFi", "Air Conditioning", "Flat-screen TV", "Work Desk", "City View", "En-suite Bathroom"]
  },

  // Floor 2
  {
    id: 9,
    name: "Horizon Deluxe",
    type: "Deluxe",
    floor: 2,
    view: "Sea View",
    price: 129,
    rating: 4.8,
    reviewCount: 187,
    maxGuests: 2,
    beds: 1,
    bedType: "King",
    size: 36,
    image: "https://images.unsplash.com/photo-1779942578833-5f00dc79d6d1?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1779942578833-5f00dc79d6d1?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1696854649609-1fd6e5abf87f?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "Elevated living with panoramic sea views from the second floor. The Horizon Deluxe features a spa-style bathroom with freestanding tub, premium linens, and curated local artwork. A sanctuary for those who appreciate thoughtful luxury.",
    amenities: ["Free WiFi", "Air Conditioning", "4K Smart TV", "Freestanding Bathtub", "Rain Shower", "Mini Bar", "Sea View", "Balcony", "Turndown Service"],
    featured: true
  },
  {
    id: 10,
    name: "Terrace Deluxe",
    type: "Deluxe",
    floor: 2,
    view: "Sea View",
    price: 139,
    rating: 4.8,
    reviewCount: 162,
    maxGuests: 3,
    beds: 1,
    bedType: "King",
    size: 40,
    image: "https://images.unsplash.com/photo-1693098243367-93320637839e?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1693098243367-93320637839e?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "Your private terrace awaits. Sip morning coffee as the sun rises over the ocean, then spend evenings watching the horizon glow in amber and violet. The terrace has a daybed and outdoor shower.",
    amenities: ["Free WiFi", "Air Conditioning", "4K Smart TV", "Private Terrace", "Sea View", "Mini Bar", "Rainfall Shower", "Espresso Machine"],
    featured: true
  },
  {
    id: 11,
    name: "Garden Deluxe",
    type: "Deluxe",
    floor: 2,
    view: "Garden View",
    price: 119,
    rating: 4.6,
    reviewCount: 103,
    maxGuests: 2,
    beds: 1,
    bedType: "King",
    size: 34,
    image: "https://images.unsplash.com/photo-1702830499141-a0634d87d6af?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1702830499141-a0634d87d6af?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "A romantic garden-view deluxe room offering elevated tranquility. The second-floor position catches the gentle sea breeze while overlooking our manicured tropical grounds.",
    amenities: ["Free WiFi", "Air Conditioning", "Smart TV", "Garden View", "Mini Bar", "Rainfall Shower", "Work Desk"]
  },
  {
    id: 12,
    name: "Twin Deluxe",
    type: "Deluxe",
    floor: 2,
    view: "City View",
    price: 112,
    rating: 4.5,
    reviewCount: 88,
    maxGuests: 2,
    beds: 2,
    bedType: "Twin",
    size: 32,
    image: "https://images.unsplash.com/photo-1776761603930-e4509e386fbf?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1776761603930-e4509e386fbf?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "Upgraded twin beds meet deluxe finishes. Perfect for friends traveling together who want to share the experience without compromising on individual comfort.",
    amenities: ["Free WiFi", "Air Conditioning", "Smart TV", "City View", "Mini Bar", "Rainfall Shower", "Work Desk"]
  },
  {
    id: 13,
    name: "Sea Breeze Deluxe",
    type: "Deluxe",
    floor: 2,
    view: "Sea View",
    price: 135,
    rating: 4.9,
    reviewCount: 211,
    maxGuests: 2,
    beds: 1,
    bedType: "King",
    size: 38,
    image: "https://images.unsplash.com/photo-1775566081059-6e35805e4edd?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1775566081059-6e35805e4edd?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "The most sought-after room on the second floor. Every corner of this deluxe room frames the sea — from the bed to the marble bathroom vanity. Guests consistently rate it the most beautiful in the hotel.",
    amenities: ["Free WiFi", "Air Conditioning", "4K Smart TV", "Sea View", "Balcony", "Marble Bathroom", "Premium Minibar", "Pillow Menu"],
    featured: true
  },
  {
    id: 14,
    name: "Deluxe Garden Connecting",
    type: "Connecting Room",
    floor: 2,
    view: "Garden View",
    price: 169,
    rating: 4.6,
    reviewCount: 74,
    maxGuests: 4,
    beds: 2,
    bedType: "King + Double",
    size: 50,
    image: "https://images.unsplash.com/photo-1609602126247-4ab7188b4aa1?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1609602126247-4ab7188b4aa1?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "Two deluxe rooms connected by a private hallway, each with garden views. Ideal for families who want the intimacy of a suite with the flexibility of separate rooms.",
    amenities: ["Free WiFi", "Air Conditioning", "2 Smart TVs", "Garden View", "Connecting Door", "2 Bathrooms", "2 Mini Bars"]
  },
  {
    id: 15,
    name: "Panorama Deluxe",
    type: "Deluxe",
    floor: 2,
    view: "Sea View",
    price: 145,
    rating: 4.7,
    reviewCount: 139,
    maxGuests: 2,
    beds: 1,
    bedType: "King",
    size: 40,
    image: "https://images.unsplash.com/photo-1664189767954-e4e605ae46da?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1664189767954-e4e605ae46da?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "Floor-to-ceiling panoramic windows wrap around this corner deluxe room, giving an unobstructed 180-degree view of the open sea. The Jacuzzi tub faces the view — a decision you will appreciate.",
    amenities: ["Free WiFi", "Air Conditioning", "4K Smart TV", "Panoramic Sea View", "Jacuzzi", "Mini Bar", "Espresso Machine"]
  },

  // Floor 3
  {
    id: 16,
    name: "Ocean Haven Suite",
    type: "Family Suite",
    floor: 3,
    view: "Sea View",
    price: 249,
    rating: 5.0,
    reviewCount: 87,
    maxGuests: 6,
    beds: 3,
    bedType: "King + 2 Twins",
    size: 72,
    image: "https://images.unsplash.com/photo-1776876648949-63ccabf63b10?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1776876648949-63ccabf63b10?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1779942578833-5f00dc79d6d1?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1693098243367-93320637839e?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "Our signature suite occupies the entire northeast corner of the third floor. A king master bedroom, two twin rooms, a panoramic sea terrace, and a full kitchen make this the ultimate family sanctuary above the ocean.",
    amenities: ["Free WiFi", "Air Conditioning", "3 Smart TVs", "Full Kitchen", "Private Terrace", "Sea View", "2 Full Bathrooms", "Jacuzzi", "Children's Play Area", "Butler Service", "24h Room Service"],
    featured: true
  },
  {
    id: 17,
    name: "Penthouse Deluxe",
    type: "Deluxe",
    floor: 3,
    view: "Sea View",
    price: 189,
    rating: 4.9,
    reviewCount: 156,
    maxGuests: 2,
    beds: 1,
    bedType: "King",
    size: 48,
    image: "https://images.unsplash.com/photo-1702830499141-a0634d87d6af?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1702830499141-a0634d87d6af?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "The highest deluxe in the hotel. On the third floor, the Penthouse Deluxe offers an elevated sea view unlike any other, with ceiling-height windows and a private lounging terrace.",
    amenities: ["Free WiFi", "Air Conditioning", "4K Smart TV", "Private Terrace", "Sea View", "Jacuzzi", "Premium Minibar", "Butler on call"],
    featured: true
  },
  {
    id: 18,
    name: "Sky Garden Suite",
    type: "Family Suite",
    floor: 3,
    view: "Garden View",
    price: 219,
    rating: 4.8,
    reviewCount: 112,
    maxGuests: 5,
    beds: 2,
    bedType: "King + Bunk",
    size: 65,
    image: "https://images.unsplash.com/photo-1689717887631-088197cdc2ca?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1689717887631-088197cdc2ca?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "Treetop living on the third floor. The Sky Garden Suite overlooks an expanse of tropical canopy with a rooftop-style terrace where children can play safely while parents unwind below the palms.",
    amenities: ["Free WiFi", "Air Conditioning", "2 Smart TVs", "Full Kitchen", "Garden Terrace", "2 Bathrooms", "Children's Area"]
  },
  {
    id: 19,
    name: "Rooftop Connecting",
    type: "Connecting Room",
    floor: 3,
    view: "Sea View",
    price: 229,
    rating: 4.8,
    reviewCount: 98,
    maxGuests: 6,
    beds: 3,
    bedType: "King + 2 Queens",
    size: 68,
    image: "https://images.unsplash.com/photo-1775566081059-6e35805e4edd?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1775566081059-6e35805e4edd?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "Three top-floor rooms united. The Rooftop Connecting configuration offers unrivaled flexibility — perfect for large family groups who want to stay together yet enjoy private space.",
    amenities: ["Free WiFi", "Air Conditioning", "3 Smart TVs", "Sea View", "Connecting Doors", "3 Bathrooms", "Room Service"],
    featured: true
  },
  {
    id: 20,
    name: "Sunset Deluxe",
    type: "Deluxe",
    floor: 3,
    view: "Sea View",
    price: 175,
    rating: 4.8,
    reviewCount: 143,
    maxGuests: 2,
    beds: 1,
    bedType: "King",
    size: 42,
    image: "https://images.unsplash.com/photo-1696854649609-1fd6e5abf87f?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1696854649609-1fd6e5abf87f?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "Named for the spectacular sunsets visible from its west-facing balcony. Watch the sky ignite in color while soaking in the private bathtub — the most romantic room in the hotel.",
    amenities: ["Free WiFi", "Air Conditioning", "4K Smart TV", "Private Balcony", "Sea View", "Champagne on arrival", "Soaking Tub"]
  },
  {
    id: 21,
    name: "Treetop Standard",
    type: "Standard",
    floor: 3,
    view: "Garden View",
    price: 95,
    rating: 4.4,
    reviewCount: 61,
    maxGuests: 2,
    beds: 1,
    bedType: "Queen",
    size: 28,
    image: "https://images.unsplash.com/photo-1695706807850-8c66b24b3413?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1695706807850-8c66b24b3413?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "Perched on the third floor, this standard room surprises with sweeping garden-to-sea glimpses. Unpretentious and honest — it rewards guests who know that the best views don't always require the biggest budget.",
    amenities: ["Free WiFi", "Air Conditioning", "Smart TV", "Garden View", "En-suite Bathroom"]
  },
  {
    id: 22,
    name: "Sunrise Suite",
    type: "Family Suite",
    floor: 3,
    view: "Sea View",
    price: 235,
    rating: 4.9,
    reviewCount: 177,
    maxGuests: 5,
    beds: 2,
    bedType: "King + Twin",
    size: 68,
    image: "https://images.unsplash.com/photo-1776761603930-e4509e386fbf?w=600&h=400&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1776761603930-e4509e386fbf?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1776876648949-63ccabf63b10?w=1200&h=800&fit=crop&auto=format"
    ],
    description: "Every morning begins with the ocean waking you gently. The Sunrise Suite faces east, capturing the first light across the sea. A spacious living area, generous king bedroom, and separate twin room make family mornings feel leisurely.",
    amenities: ["Free WiFi", "Air Conditioning", "2 Smart TVs", "Full Kitchenette", "East-facing Balcony", "Sea View", "2 Bathrooms", "Room Service"],
    featured: true
  }
];

const DEFAULT_BOOKING_HISTORY = [
  { id: "OH-2025-0234", room: "Coastal Family Suite", roomId: 4, dates: "Jun 20–25, 2025", status: "Confirmed", total: 945, bookedOn: "May 2, 2025", guests: 4 },
  { id: "OH-2024-0891", room: "Horizon Deluxe", roomId: 9, dates: "Mar 15–18, 2025", status: "Completed", total: 387, bookedOn: "Mar 10, 2025", guests: 2 },
  { id: "OH-2024-0612", room: "Ocean Breeze Standard", roomId: 1, dates: "Dec 24–26, 2024", status: "Completed", total: 178, bookedOn: "Dec 18, 2024", guests: 2 },
  { id: "OH-2023-1104", room: "Garden Serenity Standard", roomId: 2, dates: "Nov 1–3, 2023", status: "Cancelled", total: 158, bookedOn: "Oct 25, 2023", guests: 1 }
];

const DEFAULT_PROFILE = {
  name: "Nguyen Van An",
  phone: "0901 234 567",
  email: "vanan@gmail.com",
  joined: "January 2023",
  tier: "Gold Member",
  avatar: "N"
};

// Storage Helpers
function getStorage(key, defaultValue) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

// Database APIs
const db = {
  getRooms() {
    return DEFAULT_ROOMS;
  },

  getRoomById(id) {
    return DEFAULT_ROOMS.find(r => r.id === parseInt(id));
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
    return getStorage("oh_bookings", DEFAULT_BOOKING_HISTORY);
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
      checkOut: tomorrow,
      adults: 2,
      kids: 0
    });
  },

  saveSearchState(searchState) {
    setStorage("oh_search", searchState);
  }
};

window.HotelDb = db;
