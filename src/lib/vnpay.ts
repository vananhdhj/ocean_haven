import "server-only"; // chặn nhầm import vào client component
import { VNPay, HashAlgorithm, ignoreLogger } from "vnpay";

function createVNPayInstance() {
  return new VNPay({
    tmnCode: process.env.VNPAY_TMN_CODE || "",
    secureSecret: process.env.VNPAY_HASH_SECRET || "",
    vnpayHost: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn",
    testMode: true, // đổi false khi lên production
    hashAlgorithm: HashAlgorithm.SHA512,
    enableLog: true,
    loggerFn: ignoreLogger,
  });
}

export const vnpay = new Proxy({} as VNPay, {
  get(_target, prop) {
    const instance = createVNPayInstance();
    const value = instance[prop as keyof VNPay];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
  },
});
