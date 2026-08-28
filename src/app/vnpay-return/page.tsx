import { verifyVnpaySignature } from "@/lib/vnpay";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";

export const metadata = {
  title: "Payment Result — Ocean Haven Hotel",
};

export default async function VnpayReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const params: Record<string, string> = {};

  // Convert searchParams to a plain object of strings
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (typeof value === "string") {
      params[key] = value;
    }
  }

  const valid = verifyVnpaySignature(params);
  const responseCode = params["vnp_ResponseCode"];
  const bookingCode = params["vnp_TxnRef"];
  const vnp_Amount = Number(params["vnp_Amount"] || 0) / 100;
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
          transaction_id: params["vnp_TransactionNo"] || "",
          status: "Completed",
        },
        { onConflict: "booking_id" }
      );
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center p-4 flex-1">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-lg font-sans">
        {/* Status Icon */}
        <div className="mb-4">
          {isSuccess ? (
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <XCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1
          className="text-2xl font-semibold italic text-slate-900 mb-1.5"
          style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
        >
          {isSuccess ? "Payment Successful" : "Payment Failed"}
        </h1>
        <p className="text-xs text-slate-500 mb-6">
          {isSuccess
            ? "Your booking has been confirmed and paid for."
            : "There was an issue processing your payment."}
        </p>

        {/* Transaction Info Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5 text-left mb-6">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Booking Code:</span>
            <span className="font-semibold text-slate-900">{bookingCode}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Amount:</span>
            <span
              className="font-bold text-slate-900"
              style={{ fontFamily: "'Merriweather', 'DINPro', serif" }}
            >
              {formatMoney(vnp_Amount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Response Code:</span>
            <span className="font-semibold text-slate-900">{responseCode}</span>
          </div>
        </div>

        {!valid && (
          <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg mb-6 border border-red-200">
            Invalid payment signature. This transaction may have been tampered with.
          </p>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Link
            href="/profile"
            className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-3 rounded-xl font-bold text-sm transition-colors text-center inline-block shadow-xs cursor-pointer"
          >
            View My Bookings
          </Link>
          {!isSuccess && (
            <Link
              href="/rooms"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-sm transition-colors text-center inline-block cursor-pointer"
            >
              Try Booking Again
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
