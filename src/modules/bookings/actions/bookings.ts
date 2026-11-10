"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { execProc } from "@/shared/lib/db/sqlserver";
import { businessErrorMessage } from "@/shared/lib/db/errors";
import { revalidatePath } from "next/cache";
import { BookingActionResult } from "../types";

export async function createBooking(
  _prevState: BookingActionResult | null,
  formData: FormData
): Promise<BookingActionResult> {
  const roomId = formData.get("roomId") as string;
  const checkIn = formData.get("checkIn") as string;
  const checkOut = formData.get("checkOut") as string;
  const guests = parseInt(formData.get("guests") as string, 10);
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const specialRequests = formData.get("specialRequests") as string;

  if (!roomId || !checkIn || !checkOut || !guests || !name || !email || !phone) {
    return { success: false, message: "Please fill in all required fields." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, message: "You must be logged in to book a room." };
  }

  // Availability check, price calculation, booking + pay-at-hotel payment rows:
  // all done atomically in one transaction by dbo.sp_CreateBooking.
  try {
    const [[booking]] = await execProc<{
      id: string;
      booking_code: string;
      total_price: number;
    }>("dbo.sp_CreateBooking", {
      UserId: user.id,
      UserEmail: user.email ?? null,
      RoomId: roomId,
      CheckIn: checkIn,
      CheckOut: checkOut,
      GuestCount: guests,
      GuestName: name,
      GuestEmail: email,
      GuestPhone: phone,
      SpecialRequests: specialRequests || null,
    });

    revalidatePath("/profile");

    return {
      success: true,
      bookingId: String(booking.id),
      bookingCode: booking.booking_code,
      totalPrice: Number(booking.total_price),
    };
  } catch (err) {
    const message = businessErrorMessage(err);
    if (!message) console.error("Booking Error:", err);
    return { success: false, message: message ?? "Failed to create booking. Please try again." };
  }
}

export async function cancelMyBooking(
  bookingId: string
): Promise<{ success: boolean; message?: string }> {
  if (!bookingId) {
    return { success: false, message: "Missing booking." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be logged in to cancel a booking." };
  }

  // Ownership, cancellation rules and the payment update happen in one
  // transaction in dbo.sp_CancelMyBooking; the user id comes from the session.
  try {
    await execProc("dbo.sp_CancelMyBooking", { BookingId: bookingId, UserId: user.id });
  } catch (err) {
    const message = businessErrorMessage(err);
    if (!message) console.error("Cancel booking error:", err);
    return { success: false, message: message ?? "Failed to cancel booking. Please try again." };
  }

  revalidatePath("/profile");
  return { success: true };
}
