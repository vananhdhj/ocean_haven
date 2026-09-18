import { ProductCode, VnpLocale, dateFormat, type ReturnQueryFromVNPay } from "vnpay";
import { vnpay } from "@/lib/vnpay";

export { vnpay };

export function buildVnpayUrl(
  totalPrice: number,
  bookingCode: string,
  vnpTxnRef?: string,
  ipAddr: string = "127.0.0.1"
): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return vnpay.buildPaymentUrl({
    vnp_Amount: totalPrice, // Thư viện vnpay tự nhân 100
    vnp_IpAddr: ipAddr,
    vnp_TxnRef: vnpTxnRef || `${bookingCode}_${Date.now()}`,
    vnp_OrderInfo: `Thanh toan dat phong Ocean Haven: ${bookingCode}`,
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/vnpay-return`,
    vnp_Locale: VnpLocale.VN,
    vnp_ExpireDate: dateFormat(tomorrow),
  });
}

export function verifyVnpaySignature(params: Record<string, string>): {
  valid: boolean;
  responseCode: string;
} {
  try {
    const verify = vnpay.verifyReturnUrl(params as unknown as ReturnQueryFromVNPay);
    return {
      valid: verify.isVerified,
      responseCode: params["vnp_ResponseCode"] || "",
    };
  } catch {
    return { valid: false, responseCode: params["vnp_ResponseCode"] || "" };
  }
}
