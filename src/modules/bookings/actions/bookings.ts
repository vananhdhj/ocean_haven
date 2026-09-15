"use server";

import { createClient } from "@/shared/lib/supabase/server";
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
  const paymentMethod = formData.get("paymentMethod") as string;

  if (!roomId || !checkIn || !checkOut || !name || !email || !phone) {
    return { success: false, message: "Please fill in all required fields." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, message: "You must be logged in to book a room." };
  }

  // Verify room availability
  const { data: overlappingBookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("room_id", roomId)
    .not("status", "in", '("Cancelled","Completed")')
    .lt("check_in", checkOut)
    .gt("check_out", checkIn);

  if (overlappingBookings && overlappingBookings.length > 0) {
    return { success: false, message: "Room is not available for selected dates." };
  }

  // Calculate total price
  const { data: room } = await supabase
    .from("rooms")
    .select("price")
    .eq("id", roomId)
    .single();

  if (!room) {
    return { success: false, message: "Room not found." };
  }

  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (nights <= 0) {
    return { success: false, message: "Check-out date must be after check-in date." };
  }
  
  const totalPrice = room.price * nights;
  
  // Generate booking code
  const bookingCode = `B${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;

  // Set hold expiry for VNPay
  let holdExpiresAt = null;
  if (paymentMethod === "vnpay") {
    const expireDate = new Date();
    expireDate.setMinutes(expireDate.getMinutes() + 15);
    holdExpiresAt = expireDate.toISOString();
  }

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      id: `booking-${Date.now()}`,
      booking_code: bookingCode,
      user_id: user.id,
      room_id: roomId,
      check_in: checkIn,
      check_out: checkOut,
      guest_count: guests,
      guest_name: name,
      guest_email: email,
      guest_phone: phone,
      special_requests: specialRequests || null,
      total_price: totalPrice,
      status: "Pending",
      hold_expires_at: holdExpiresAt,
    })
    .select()
    .single();

  if (bookingError || !booking) {
    console.error("Booking Error:", bookingError);
    return { success: false, message: "Failed to create booking. Please try again." };
  }

  // Create payment record
  const { error: paymentError } = await supabase
    .from("payments")
    .insert({
      id: `payment-${Date.now()}`,
      booking_id: booking.id,
      payment_method: paymentMethod,
      amount: totalPrice,
      status: "Pending",
    });

  if (paymentError) {
    console.error("Payment Error:", paymentError);
  }

  revalidatePath("/profile");
  
  return { 
    success: true, 
    bookingId: booking.id, 
    bookingCode: booking.booking_code,
    totalPrice,
    paymentMethod
  };
}
