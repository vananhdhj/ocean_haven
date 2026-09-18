import { buildVnpayUrl, verifyVnpaySignature } from "./vnpay";
import { vnpay } from "@/lib/vnpay";
import { buildPaymentUrlSearchParams, calculateSecureHash, HashAlgorithm } from "vnpay";

describe("VNPay Payment Utility", () => {
  const originalEnv = process.env;

  beforeEach(() => {
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

  // ─── buildVnpayUrl ───────────────────────────────────
  describe("buildVnpayUrl", () => {
    it("should build a valid VNPay checkout URL with correct parameters", () => {
      const urlString = buildVnpayUrl(1500000, "B123456", "TXN_999", "192.168.1.1");
      const url = new URL(urlString);

      expect(url.origin).toBe("https://sandbox.vnpayment.vn");
      expect(url.pathname).toBe("/paymentv2/vpcpay.html");
      expect(url.searchParams.get("vnp_TmnCode")).toBe("TEST_TMN");
      expect(url.searchParams.get("vnp_TxnRef")).toBe("TXN_999");
      expect(url.searchParams.get("vnp_IpAddr")).toBe("192.168.1.1");
      expect(url.searchParams.get("vnp_CurrCode")).toBe("VND");
      expect(url.searchParams.get("vnp_Locale")).toBe("vn");
      expect(url.searchParams.get("vnp_Command")).toBe("pay");
      expect(url.searchParams.get("vnp_SecureHash")).toBeTruthy();
    });

    it("should include booking code in order info", () => {
      const urlString = buildVnpayUrl(500000, "OCEAN-999");
      const url = new URL(urlString);

      expect(url.searchParams.get("vnp_OrderInfo")).toContain("OCEAN-999");
    });

    it("should multiply amount by 100 for VNPay format", () => {
      const urlString = buildVnpayUrl(2500000, "B100");
      const url = new URL(urlString);

      expect(url.searchParams.get("vnp_Amount")).toBe("250000000");
    });

    it("should include expire date parameter", () => {
      const urlString = buildVnpayUrl(1000000, "B100");
      const url = new URL(urlString);

      expect(url.searchParams.get("vnp_ExpireDate")).toBeTruthy();
      expect(url.searchParams.get("vnp_ExpireDate")!.length).toBe(14);
    });

    it("should use default IP address when not provided", () => {
      const urlString = buildVnpayUrl(1000000, "B100");
      const url = new URL(urlString);

      expect(url.searchParams.get("vnp_IpAddr")).toBe("127.0.0.1");
    });

    it("should export vnpay client instance", () => {
      expect(vnpay).toBeDefined();
      expect(typeof vnpay.buildPaymentUrl).toBe("function");
      expect(typeof vnpay.verifyReturnUrl).toBe("function");
      expect(typeof vnpay.verifyIpnCall).toBe("function");
    });
  });

  // ─── verifyVnpaySignature ─────────────────────────────
  describe("verifyVnpaySignature", () => {
    function signParams(params: Record<string, string | number>, secret: string): string {
      const clone = { ...params };
      delete clone.vnp_SecureHash;
      const sp = buildPaymentUrlSearchParams(clone);
      return calculateSecureHash({
        secureSecret: secret,
        data: sp.toString(),
        hashAlgorithm: HashAlgorithm.SHA512,
        bufferEncode: "utf-8",
      });
    }

    it("should verify valid signature using vnpay library", () => {
      const params: Record<string, string> = {
        vnp_Amount: "100000000",
        vnp_BankCode: "NCB",
        vnp_CardType: "ATM",
        vnp_OrderInfo: "Thanh toan don hang",
        vnp_ResponseCode: "00",
        vnp_TmnCode: "TEST_TMN",
        vnp_TxnRef: "TXN_123456",
        vnp_TransactionNo: "12345678",
      };

      const validHash = signParams(params, "TEST_SECRET_KEY");
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
        vnp_TmnCode: "TEST_TMN",
        vnp_TxnRef: "TXN_123",
        vnp_SecureHash: "fake_hash_1234567890abcdef",
      };

      const result = verifyVnpaySignature(params);
      expect(result.valid).toBe(false);
    });

    it("should reject if amount was tampered after signing", () => {
      const params: Record<string, string> = {
        vnp_Amount: "100000000",
        vnp_ResponseCode: "00",
        vnp_TmnCode: "TEST_TMN",
        vnp_TxnRef: "TXN_123",
      };

      const hash = signParams(params, "TEST_SECRET_KEY");

      const tamperedParams = {
        ...params,
        vnp_Amount: "50000000", // altered amount
        vnp_SecureHash: hash,
      };

      const result = verifyVnpaySignature(tamperedParams);
      expect(result.valid).toBe(false);
    });

    it("should return empty responseCode when vnp_ResponseCode is missing", () => {
      const params: Record<string, string> = {
        vnp_Amount: "100000000",
        vnp_TmnCode: "TEST_TMN",
        vnp_TxnRef: "TXN_123",
      };

      const result = verifyVnpaySignature(params);
      expect(result.responseCode).toBe("");
    });

    it("should correctly verify signature with special characters in OrderInfo", () => {
      const params: Record<string, string> = {
        vnp_Amount: "150000000",
        vnp_OrderInfo: "Thanh toan dat phong Ocean Haven: DELUXE #101 & VIP",
        vnp_ResponseCode: "00",
        vnp_TmnCode: "TEST_TMN",
        vnp_TxnRef: "TXN_SPECIAL",
      };

      const hash = signParams(params, "TEST_SECRET_KEY");
      const result = verifyVnpaySignature({
        ...params,
        vnp_SecureHash: hash,
      });

      expect(result.valid).toBe(true);
    });
  });
});
