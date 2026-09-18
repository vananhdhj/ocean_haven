import { NextRequest, NextResponse } from "next/server";
import { ProductCode, VnpLocale, dateFormat } from "vnpay";
import { vnpay } from "@/lib/vnpay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { totalPrice, bookingCode, vnpTxnRef } = body;

    if (!totalPrice || !bookingCode) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const ipAddr = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const txnRef = vnpTxnRef || `${bookingCode}_${Date.now()}`;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: totalPrice,
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan dat phong Ocean Haven: ${bookingCode}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/vnpay-return`,
      vnp_Locale: VnpLocale.VN,
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    return NextResponse.json({ paymentUrl });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const bookingCode = searchParams.get("bookingCode");
  const amountStr = searchParams.get("amount");

  if (!bookingCode || !amountStr) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const amount = Number(amountStr);
  const vnpTxnRef = `${bookingCode}_${Date.now()}`;
  const ipAddr = req.headers.get("x-forwarded-for") ?? "127.0.0.1";

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const paymentUrl = vnpay.buildPaymentUrl({
    vnp_Amount: amount,
    vnp_IpAddr: ipAddr,
    vnp_TxnRef: vnpTxnRef,
    vnp_OrderInfo: `Thanh toan dat phong Ocean Haven: ${bookingCode}`,
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/vnpay-return`,
    vnp_Locale: VnpLocale.VN,
    vnp_ExpireDate: dateFormat(tomorrow),
  });

  return NextResponse.redirect(paymentUrl);
}
