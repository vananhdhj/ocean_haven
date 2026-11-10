import { execProc } from "@/shared/lib/db/sqlserver";
import { Booking } from "../types";

interface UserBookingRow {
  id: string;
  booking_code: string;
  room_name: string;
  check_in: string;
  check_out: string;
  guest_count: number;
  status: Booking["status"];
  payment_status: Booking["payment_status"] | null;
  created_at: string;
  total_price: number;
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
  try {
    const [rows] = await execProc<UserBookingRow>("dbo.sp_GetUserBookings", { UserId: userId });

    return rows.map((row) => ({
      id: String(row.id),
      booking_code: row.booking_code,
      room: row.room_name,
      check_in: row.check_in,
      check_out: row.check_out,
      guests: row.guest_count,
      status: row.status,
      payment_status: row.payment_status || "None",
      bookedOn: row.created_at,
      total: Number(row.total_price),
    }));
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    return [];
  }
}
