import { XCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Payment Failed — Ocean Haven Hotel",
};

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const reason =
    typeof resolvedParams.reason === "string" ? resolvedParams.reason : "";

  let errorDescription = "There was an issue processing your payment with VNPay.";
  if (reason === "invalid-signature") {
    errorDescription =
      "Payment signature verification failed. The transaction may have been tampered with.";
  } else if (reason === "invalid-data") {
    errorDescription = "Invalid transaction data received from the payment gateway.";
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center p-4 flex-1">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-lg font-sans">
        <div className="mb-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <XCircle className="w-8 h-8" />
          </div>
        </div>

        <h1
          className="text-2xl font-semibold text-slate-900 mb-1.5"
          style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
        >
          Payment Failed
        </h1>
        <p className="text-xs text-slate-500 mb-6">{errorDescription}</p>

        <div className="space-y-2">
          <Link
            href="/rooms"
            className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-3 rounded-xl font-bold text-sm transition-colors text-center inline-block shadow-xs cursor-pointer"
          >
            Try Booking Again
          </Link>
          <Link
            href="/profile"
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-sm transition-colors text-center inline-block cursor-pointer"
          >
            View My Bookings
          </Link>
        </div>
      </div>
    </main>
  );
}
