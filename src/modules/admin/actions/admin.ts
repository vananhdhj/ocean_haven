"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { execProc } from "@/shared/lib/db/sqlserver";
import { businessErrorMessage } from "@/shared/lib/db/errors";
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

  // Transition rules and payment side effects live in dbo.sp_UpdateBookingStatus;
  // the history row is written by the trg_bookings_audit trigger.
  try {
    await execProc("dbo.sp_UpdateBookingStatus", { BookingId: bookingId, NewStatus: status });
  } catch (err) {
    const message = businessErrorMessage(err);
    if (!message) console.error("Update booking status error:", err);
    return { success: false, error: message ?? "Failed to update booking status" };
  }

  revalidatePath("/admin");
  return { success: true };
}
