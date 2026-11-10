import { createClient } from "@/shared/lib/supabase/server";
import { execProc } from "@/shared/lib/db/sqlserver";
import { AdminStats, AdminBooking } from "../types";

type BookingStats = Omit<AdminStats, "total_users">;

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();

  // Booking/revenue counters come from SQL Server, user count from Supabase.
  const [[[stats]], { count: total_users }] = await Promise.all([
    execProc<BookingStats>("dbo.sp_GetAdminStats"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "user"),
  ]);

  return {
    total_bookings: stats.total_bookings,
    confirmed: stats.confirmed,
    pending: stats.pending,
    cancelled: stats.cancelled,
    total_users: total_users || 0,
    total_revenue: Number(stats.total_revenue),
    total_rooms: stats.total_rooms,
  };
}

export async function getAdminBookings(phoneSearch?: string): Promise<AdminBooking[]> {
  try {
    const [rows] = await execProc<Omit<AdminBooking, "booking_id"> & { id: string }>(
      "dbo.sp_GetAdminBookings",
      { PhoneSearch: phoneSearch?.trim() || null }
    );

    return rows.map(({ id, ...row }) => ({
      ...row,
      booking_id: String(id),
      total_price: Number(row.total_price),
    }));
  } catch (err) {
    console.error("Error fetching admin bookings:", err);
    return [];
  }
}
