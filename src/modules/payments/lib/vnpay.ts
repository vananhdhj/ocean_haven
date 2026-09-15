import crypto from "crypto";

interface VnpayConfig {
  tmnCode: string;
  hashSecret: string;
  url: string;
  returnUrl: string;
}

function getConfig(): VnpayConfig {
  return {
    tmnCode: process.env.VNPAY_TMN_CODE || "",
    hashSecret: process.env.VNPAY_HASH_SECRET || "",
    url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/vnpay-return`,
  };
}

export function buildVnpayUrl(
  totalPrice: number,
  bookingCode: string,
  vnpTxnRef: string,
  ipAddr: string = "127.0.0.1",
): string {
  const config = getConfig();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const createDate = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const expireDate = new Date(now.getTime() + 15 * 60 * 1000);
  const expireDateStr = `${expireDate.getFullYear()}${pad(expireDate.getMonth() + 1)}${pad(expireDate.getDate())}${pad(expireDate.getHours())}${pad(expireDate.getMinutes())}${pad(expireDate.getSeconds())}`;

  const vnpAmount = Math.round(totalPrice) * 100;

  const inputData: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_TmnCode: config.tmnCode,
    vnp_Amount: String(vnpAmount),
    vnp_Command: "pay",
    vnp_CreateDate: createDate,
    vnp_CurrCode: "VND",
    vnp_IpAddr: ipAddr,
    vnp_Locale: "vn",
    vnp_OrderInfo: `Thanh toan dat phong Ocean Haven: ${bookingCode}`,
    vnp_OrderType: "other",
    vnp_ReturnUrl: config.returnUrl,
    vnp_TxnRef: vnpTxnRef,
    vnp_ExpireDate: expireDateStr,
  };

  const sortedKeys = Object.keys(inputData).sort();

  const queryString = sortedKeys
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(inputData[key])}`)
    .join("&");

  const secureHash = crypto
    .createHmac("sha512", config.hashSecret)
    .update(queryString)
    .digest("hex");

  return `${config.url}?${queryString}&vnp_SecureHash=${secureHash}`;
}

export function verifyVnpaySignature(params: Record<string, string>): {
  valid: boolean;
  responseCode: string;
} {
  const config = getConfig();
  const secureHash = params.vnp_SecureHash || "";

  const inputData = { ...params };
  delete inputData.vnp_SecureHash;
  delete inputData.vnp_SecureHashType;

  const sortedKeys = Object.keys(inputData)
    .filter((k) => k.startsWith("vnp_"))
    .sort();

  const hashData = sortedKeys
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(inputData[key])}`)
    .join("&");

  const computed = crypto
    .createHmac("sha512", config.hashSecret)
    .update(hashData)
    .digest("hex");

  return {
    valid: computed === secureHash,
    responseCode: params.vnp_ResponseCode || "",
  };
}
