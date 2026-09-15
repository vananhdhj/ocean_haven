import { buildVnpayUrl, verifyVnpaySignature } from "./vnpay";
import crypto from "crypto";

describe("VNPay Payment Utility", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      VNPAY_TMN_CODE: "TEST_TMN",
      VNPAY_HASH_SECRET: "TEST_SECRET_KEY",
      VNPAY_URL: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
      NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("buildVnpayUrl", () => {
    it("should build a valid VNPay checkout URL with correct parameters", () => {
      const urlString = buildVnpayUrl(1000000, "B123456", "TXN_123456", "127.0.0.1");
      const url = new URL(urlString);

      expect(url.origin + url.pathname).toBe("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
      expect(url.searchParams.get("vnp_TmnCode")).toBe("TEST_TMN");
      // VNPay expects amount multiplied by 100
      expect(url.searchParams.get("vnp_Amount")).toBe("100000000");
      expect(url.searchParams.get("vnp_Command")).toBe("pay");
      expect(url.searchParams.get("vnp_CurrCode")).toBe("VND");
      expect(url.searchParams.get("vnp_TxnRef")).toBe("TXN_123456");
      expect(url.searchParams.get("vnp_ReturnUrl")).toBe("http://localhost:3000/vnpay-return");
      expect(url.searchParams.get("vnp_SecureHash")).toBeDefined();
      // SHA512 produces a 128 character hex string
      expect(url.searchParams.get("vnp_SecureHash")?.length).toBe(128);
    });
  });

  describe("verifyVnpaySignature", () => {
    it("should verify valid signature when hash matches", () => {
      const params: Record<string, string> = {
        vnp_Amount: "100000000",
        vnp_BankCode: "NCB",
        vnp_CardType: "ATM",
        vnp_OrderInfo: "Thanh toan don hang",
        vnp_ResponseCode: "00",
        vnp_TmnCode: "TEST_TMN",
        vnp_TxnRef: "TXN_123456",
      };

      // Compute valid hash
      const sortedKeys = Object.keys(params).sort();
      const signData = sortedKeys
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join("&");
      const validHash = crypto
        .createHmac("sha512", "TEST_SECRET_KEY")
        .update(signData)
        .digest("hex");

      const testParams = {
        ...params,
        vnp_SecureHash: validHash,
      };

      const result = verifyVnpaySignature(testParams);
      expect(result.valid).toBe(true);
      expect(result.responseCode).toBe("00");
    });

    it("should reject tampered signature", () => {
      const params: Record<string, string> = {
        vnp_Amount: "100000000",
        vnp_ResponseCode: "00",
        vnp_SecureHash: "invalid_fake_hash_12345",
      };

      const result = verifyVnpaySignature(params);
      expect(result.valid).toBe(false);
    });
  });
});
