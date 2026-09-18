/**
 * @jest-environment node
 */
import { GET, POST } from "./route";
import { NextRequest } from "next/server";

// Mock the VNPay client
jest.mock("@/lib/vnpay", () => ({
  vnpay: {
    buildPaymentUrl: jest.fn(
      (params: { vnp_Amount: number; vnp_TxnRef: string; vnp_OrderInfo: string; vnp_IpAddr: string; [key: string]: unknown }) =>
        `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=${params.vnp_Amount * 100}&vnp_TxnRef=${params.vnp_TxnRef}&vnp_OrderInfo=${params.vnp_OrderInfo}&vnp_IpAddr=${params.vnp_IpAddr}&vnp_SecureHash=mock_hash`
    ),
  },
}));

describe("Integration: /api/payments/create-vnpay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/payments/create-vnpay", () => {
    it("should return 400 if bookingCode is missing", async () => {
      const url = "http://localhost:3000/api/payments/create-vnpay?amount=1000000";
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing parameters");
    });

    it("should return 400 if amount is missing", async () => {
      const url = "http://localhost:3000/api/payments/create-vnpay?bookingCode=B123456";
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing parameters");
    });

    it("should return 400 if both params are missing", async () => {
      const url = "http://localhost:3000/api/payments/create-vnpay";
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing parameters");
    });

    it("should redirect to VNPay sandbox URL with correct parameters", async () => {
      const url =
        "http://localhost:3000/api/payments/create-vnpay?bookingCode=B123456&amount=2000000";
      const request = new NextRequest(url);

      const response = await GET(request);
      const location = response.headers.get("location");

      expect(response.status).toBe(307);
      expect(location).toContain("sandbox.vnpayment.vn");
      expect(location).toContain("vnp_Amount=200000000");
    });

    it("should include x-forwarded-for IP in redirect URL when present", async () => {
      const url =
        "http://localhost:3000/api/payments/create-vnpay?bookingCode=BTEST&amount=500000";
      const request = new NextRequest(url, {
        headers: { "x-forwarded-for": "203.113.152.1" },
      });

      const response = await GET(request);
      const location = response.headers.get("location");

      expect(response.status).toBe(307);
      expect(location).toContain("203.113.152.1");
    });

    it("should use 127.0.0.1 as default IP when x-forwarded-for is absent", async () => {
      const url =
        "http://localhost:3000/api/payments/create-vnpay?bookingCode=BTEST&amount=500000";
      const request = new NextRequest(url);

      const response = await GET(request);
      const location = response.headers.get("location");

      expect(response.status).toBe(307);
      expect(location).toContain("127.0.0.1");
    });
  });

  describe("POST /api/payments/create-vnpay", () => {
    it("should return 400 if totalPrice or bookingCode is missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/payments/create-vnpay", {
        method: "POST",
        body: JSON.stringify({ totalPrice: 1000000 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing parameters");
    });

    it("should return paymentUrl when valid body is posted", async () => {
      const request = new NextRequest("http://localhost:3000/api/payments/create-vnpay", {
        method: "POST",
        body: JSON.stringify({
          totalPrice: 2500000,
          bookingCode: "BK_POST_TEST",
          vnpTxnRef: "BK_POST_TEST_99",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.paymentUrl).toBeTruthy();
      expect(data.paymentUrl).toContain("sandbox.vnpayment.vn");
      expect(data.paymentUrl).toContain("BK_POST_TEST_99");
    });
  });
});
