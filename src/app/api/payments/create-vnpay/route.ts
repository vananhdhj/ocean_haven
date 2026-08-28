import { NextRequest, NextResponse } from "next/server";
import { buildVnpayUrl } from "@/lib/vnpay";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const bookingCode = searchParams.get("bookingCode");
  const amountStr = searchParams.get("amount");

  if (!bookingCode || !amountStr) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const amount = Number(amountStr);
  const vnpTxnRef = `${bookingCode}_${Date.now()}`;
  
  // Use a proxy IP or a dummy one for the VNPay IP requirement
  const ipAddr = req.headers.get("x-forwarded-for") || "127.0.0.1";

  const vnpayUrl = buildVnpayUrl(amount, bookingCode, vnpTxnRef, ipAddr);

  // Redirect the user to the VNPay checkout page
  return NextResponse.redirect(vnpayUrl);
}
