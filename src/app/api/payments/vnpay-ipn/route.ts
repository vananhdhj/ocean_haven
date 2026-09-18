import { NextRequest, NextResponse } from "next/server";
import { vnpay } from "@/lib/vnpay";
import { createClient } from "@/shared/lib/supabase/server";
import type { ReturnQueryFromVNPay } from "vnpay";

async function findBookingByTxnRef(txnRef: string) {
  const supabase = await createClient();
  const bookingCode = txnRef.split("_")[0];

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, booking_code, total_price, status")
    .eq("booking_code", bookingCode)
    .single();

  if (!booking) return null;

  return {
    id: booking.id,
    bookingCode: booking.booking_code,
    totalPrice: booking.total_price,
    status: booking.status === "Confirmed" ? "paid" : booking.status,
    async save(status: "paid" | "failed", transactionNo?: string) {
      const newBookingStatus = status === "paid" ? "Confirmed" : "Cancelled";
      await supabase
        .from("bookings")
        .update({ status: newBookingStatus })
        .eq("id", booking.id);

      await supabase.from("payments").upsert(
        {
          booking_id: booking.id,
          amount: booking.total_price,
          method: "vnpay",
          transaction_id: transactionNo || null,
          status: status === "paid" ? "Completed" : "Failed",
        },
        { onConflict: "booking_id" }
      );
    },
  };
}

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  try {
    const verify = vnpay.verifyIpnCall(params as unknown as ReturnQueryFromVNPay);

    if (!verify.isVerified) {
      return NextResponse.json({ RspCode: "97", Message: "Checksum failed" });
    }

    const booking = await findBookingByTxnRef(verify.vnp_TxnRef);
    if (!booking) {
      return NextResponse.json({ RspCode: "01", Message: "Order not found" });
    }
    if (verify.vnp_Amount !== booking.totalPrice) {
      return NextResponse.json({ RspCode: "04", Message: "Invalid amount" });
    }
    if (booking.status === "paid") {
      return NextResponse.json({
        RspCode: "02",
        Message: "Order already confirmed",
      });
    }

    const newStatus = verify.isSuccess ? "paid" : "failed";
    await booking.save(newStatus, params["vnp_TransactionNo"] as string);

    return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
  } catch {
    return NextResponse.json({ RspCode: "99", Message: "Unknown error" });
  }
}
