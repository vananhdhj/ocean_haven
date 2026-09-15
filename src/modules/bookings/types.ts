export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";
export type PaymentStatus = "Pending" | "Completed" | "Failed" | "Refunded";

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

export interface BookingActionResult {
  success: boolean;
  message?: string;
  bookingId?: string;
  bookingCode?: string;
  totalPrice?: number;
  paymentMethod?: string;
}
