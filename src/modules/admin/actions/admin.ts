"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateBookingStatusAction(bookingId: string, status: string) {
  if (!bookingId || !status) {
    return { success: false, error: "Missing required fields" };
  }

  const supabase = await createClient();
  
  // Verify admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, error: "Forbidden" };
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Insert history record
  await supabase.from("history_booking").insert({
    id: `history-${Date.now()}`,
    booking_id: bookingId,
    action: "STATUS_CHANGE",
    note: `Admin changed status to ${status}`,
  });

  revalidatePath("/admin");
  return { success: true };
}
