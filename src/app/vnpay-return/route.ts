import { NextRequest, NextResponse } from "next/server";
import { vnpay } from "@/lib/vnpay";
import { createClient } from "@/shared/lib/supabase/server";
import type { ReturnQueryFromVNPay } from "vnpay";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  try {
    const verify = vnpay.verifyReturnUrl(params as unknown as ReturnQueryFromVNPay);

    if (!verify.isVerified) {
      return NextResponse.redirect(
        new URL("/payment-failed?reason=invalid-signature", req.url)
      );
    }
    if (!verify.isSuccess) {
      return NextResponse.redirect(new URL("/payment-failed", req.url));
    }

    // Cập nhật trạng thái đơn hàng và thanh toán trên database
    try {
      const supabase = await createClient();
      const bookingCode = (verify.vnp_TxnRef || "").split("_")[0];
      if (bookingCode) {
        await supabase
          .from("bookings")
          .update({ status: "Confirmed" })
          .eq("booking_code", bookingCode);

        const { data: booking } = await supabase
          .from("bookings")
          .select("id")
          .eq("booking_code", bookingCode)
          .single();

        if (booking) {
          await supabase.from("payments").upsert(
            {
              booking_id: booking.id,
              amount: verify.vnp_Amount,
              method: "vnpay",
              transaction_id: (params["vnp_TransactionNo"] as string) || null,
              status: "Completed",
            },
            { onConflict: "booking_id" }
          );
        }
      }
    } catch (dbErr) {
      console.error("Error updating booking on return:", dbErr);
    }

    return NextResponse.redirect(
      new URL(`/payment-success?orderId=${verify.vnp_TxnRef}`, req.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/payment-failed?reason=invalid-data", req.url)
    );
  }
}
