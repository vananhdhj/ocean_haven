import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Payment Successful — Ocean Haven Hotel",
};

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const orderId =
    typeof resolvedParams.orderId === "string" ? resolvedParams.orderId : "";
  const bookingCode = orderId.split("_")[0] || orderId;

  return (
    <main className="min-h-[70vh] flex items-center justify-center p-4 flex-1">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-lg font-sans">
        <div className="mb-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        </div>

        <h1
          className="text-2xl font-semibold text-slate-900 mb-1.5"
          style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
        >
          Payment Successful
        </h1>
        <p className="text-xs text-slate-500 mb-6">
          Your booking has been confirmed and paid successfully via VNPay.
        </p>

        {bookingCode && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5 text-left mb-6">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Booking Code:</span>
              <span className="font-semibold text-slate-900">{bookingCode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Reference:</span>
              <span className="font-mono text-slate-600 text-[11px] truncate max-w-[200px]">
                {orderId}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Link
            href="/profile"
            className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-3 rounded-xl font-bold text-sm transition-colors text-center inline-block shadow-xs cursor-pointer"
          >
            View My Bookings
          </Link>
          <Link
            href="/"
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-sm transition-colors text-center inline-block cursor-pointer"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
