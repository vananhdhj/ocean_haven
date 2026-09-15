import { BookingStatus, PaymentStatus } from "@/modules/bookings";

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
