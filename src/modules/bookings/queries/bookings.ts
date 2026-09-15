import { createClient } from "@/shared/lib/supabase/server";
import { Booking } from "../types";

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, booking_code, check_in, check_out, guest_count,
      total_price, status, created_at,
      rooms ( name ),
      payments ( status )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    booking_code: row.booking_code as string,
    room: (row.rooms as { name: string } | null)?.name || "",
    check_in: row.check_in as string,
    check_out: row.check_out as string,
    guests: row.guest_count as number,
    status: row.status as Booking["status"],
    payment_status: (row.payments as { status: string } | null)?.status || "None",
    bookedOn: row.created_at as string,
    total: Number(row.total_price),
  })) as Booking[];
}
