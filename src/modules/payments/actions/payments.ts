"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { verifyVnpaySignature } from "../lib/vnpay";
import { VNPayVerificationResult } from "../types";

export async function processVNPayReturn(
  params: Record<string, string>
): Promise<VNPayVerificationResult> {
  const { valid, responseCode } = verifyVnpaySignature(params);
  const bookingCode = params["vnp_TxnRef"] || "";
  const vnp_Amount = Number(params["vnp_Amount"] || 0) / 100;
  const transactionNo = params["vnp_TransactionNo"] || "";
  const isSuccess = valid && responseCode === "00";

  if (isSuccess && bookingCode) {
    const supabase = await createClient();

    // 1. Update Booking status to 'Confirmed'
    await supabase
      .from("bookings")
      .update({ status: "Confirmed" })
      .eq("booking_code", bookingCode);

    // 2. Find booking ID to update/create Payment
    const { data: booking } = await supabase
      .from("bookings")
      .select("id")
      .eq("booking_code", bookingCode)
      .single();

    if (booking) {
      await supabase.from("payments").upsert(
        {
          booking_id: booking.id,
          amount: vnp_Amount,
          method: "vnpay",
          transaction_id: transactionNo,
          status: "Completed",
        },
        { onConflict: "booking_id" }
      );
    }
  }

  return {
    isValid: valid,
    isSuccess,
    bookingCode,
    amount: vnp_Amount,
    responseCode,
    transactionNo,
  };
}
