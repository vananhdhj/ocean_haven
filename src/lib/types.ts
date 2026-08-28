// ============================================================
// Shared TypeScript types for Ocean Haven
// ============================================================

export type UserRole = "user" | "admin";
export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";
export type PaymentStatus = "Pending" | "Completed" | "Failed" | "Refunded";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  type: string;
  floor: number;
  view: string;
  price: number;
  rating: number;
  reviewCount: number;
  maxGuests: number;
  beds: number;
  bedType: string;
  size: number;
  image: string;
  images: string[];
  description: string;
  amenities: string[];
  featured: boolean;
}

export interface RoomRaw {
  id: string;
  name: string;
  floor: number;
  rating: number;
  review_count: number;
  size: number;
  max_guests: number;
  bed_count: number;
  description: string;
  price: number;
  is_active: boolean;
  room_types: { name: string } | null;
  view_types: { name: string } | null;
  bed_types: { name: string } | null;
  room_images: { image_url: string; is_primary: boolean }[];
  room_amenities: { amenities: { name: string } }[];
}

export interface Booking {
  id: string;
  booking_code: string;
  room: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: BookingStatus;
  payment_status: PaymentStatus | "None";
  bookedOn: string;
  total: number;
}

export interface BookingDetail {
  id: string;
  booking_code: string;
  user_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  guest_count: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  special_requests: string;
  total_price: number;
  status: BookingStatus;
  hold_expires_at: string | null;
  created_at: string;
  rooms: { name: string; price: number } | null;
  payments: { status: PaymentStatus; transaction_id: string | null } | null;
}

export interface AdminStats {
  total_bookings: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  total_users: number;
  total_revenue: number;
  total_rooms: number;
}

export interface AdminBooking {
  booking_id: string;
  booking_code: string;
  guest_name: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: BookingStatus;
  created_at: string;
  room_name: string;
  user_email: string | null;
  payment_status: PaymentStatus | null;
}

// Featured room IDs (same as original PHP)
export const FEATURED_ROOM_IDS = [
  "room-001",
  "room-004",
  "room-007",
  "room-009",
  "room-010",
  "room-013",
  "room-016",
  "room-017",
  "room-019",
  "room-022",
];
