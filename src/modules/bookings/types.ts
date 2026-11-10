export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";
/** Guests pay at the hotel: Pending until the stay is completed (cash collected). */
export type PaymentStatus = "Pending" | "Completed" | "Cancelled";

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
  created_at: string;
  rooms: { name: string; price: number } | null;
  payments: { status: PaymentStatus } | null;
}

export interface BookingActionResult {
  success: boolean;
  message?: string;
  bookingId?: string;
  bookingCode?: string;
  totalPrice?: number;
}
