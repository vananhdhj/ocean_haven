import { createClient } from "@/shared/lib/supabase/server";
import { AdminStats, AdminBooking } from "../types";

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();

  const [
    { count: total_bookings },
    { count: confirmed },
    { count: pending },
    { count: cancelled },
    { count: total_users },
    { count: total_rooms },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }).in("status", ["Confirmed", "Completed"]),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "Pending"),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "Cancelled"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "user"),
    supabase.from("rooms").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("payments").select("amount").eq("status", "Completed"),
  ]);

  const total_revenue = revenueData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  return {
    total_bookings: total_bookings || 0,
    confirmed: confirmed || 0,
    pending: pending || 0,
    cancelled: cancelled || 0,
    total_users: total_users || 0,
    total_revenue,
    total_rooms: total_rooms || 0,
  };
}

export async function getAdminBookings(phoneSearch?: string): Promise<AdminBooking[]> {
  const supabase = await createClient();

  let query = supabase
    .from("bookings")
    .select(`
      id, booking_code, guest_name, guest_phone, check_in, check_out,
      total_price, status, created_at,
      rooms ( name ),
      users ( email, phone ),
      payments ( status )
    `)
    .order("check_in", { ascending: false });

  if (phoneSearch && phoneSearch.trim()) {
    query = query.or(`guest_phone.ilike.%${phoneSearch}%`);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((row: Record<string, unknown>) => ({
    booking_id: row.id as string,
    booking_code: row.booking_code as string,
    guest_name: row.guest_name as string,
    guest_phone: row.guest_phone as string,
    check_in: row.check_in as string,
    check_out: row.check_out as string,
    total_price: Number(row.total_price),
    status: row.status as AdminBooking["status"],
    created_at: row.created_at as string,
    room_name: (row.rooms as { name: string } | null)?.name || "",
    user_email: (row.users as { email: string } | null)?.email || null,
    payment_status: (row.payments as { status: string } | null)?.status || null,
  })) as AdminBooking[];
}
