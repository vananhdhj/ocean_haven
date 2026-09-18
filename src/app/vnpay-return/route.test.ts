/**
 * @jest-environment node
 */
import { GET } from "./route";
import { NextRequest } from "next/server";
import { vnpay } from "@/lib/vnpay";

jest.mock("@/lib/vnpay", () => ({
  vnpay: {
    verifyReturnUrl: jest.fn(),
  },
}));

jest.mock("@/shared/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: "mock-booking-id" } }),
          }),
        }),
        upsert: jest.fn().mockResolvedValue({ error: null }),
      }),
    })
  ),
}));

describe("Integration: GET /vnpay-return", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should redirect to /payment-failed?reason=invalid-signature if signature is invalid", async () => {
    (vnpay.verifyReturnUrl as jest.Mock).mockReturnValueOnce({
      isVerified: false,
      isSuccess: false,
    });

    const request = new NextRequest("http://localhost:3000/vnpay-return?vnp_ResponseCode=00");
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/payment-failed?reason=invalid-signature");
  });

  it("should redirect to /payment-failed if transaction was not successful", async () => {
    (vnpay.verifyReturnUrl as jest.Mock).mockReturnValueOnce({
      isVerified: true,
      isSuccess: false,
    });

    const request = new NextRequest("http://localhost:3000/vnpay-return?vnp_ResponseCode=24");
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/payment-failed");
    expect(location).not.toContain("invalid-signature");
  });

  it("should redirect to /payment-success?orderId=... and update DB if transaction is verified and successful", async () => {
    (vnpay.verifyReturnUrl as jest.Mock).mockReturnValueOnce({
      isVerified: true,
      isSuccess: true,
      vnp_TxnRef: "B123456_9999",
      vnp_Amount: 1500000,
    });

    const request = new NextRequest(
      "http://localhost:3000/vnpay-return?vnp_ResponseCode=00&vnp_TxnRef=B123456_9999"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/payment-success?orderId=B123456_9999");
  });

  it("should redirect to /payment-failed?reason=invalid-data on thrown exception", async () => {
    (vnpay.verifyReturnUrl as jest.Mock).mockImplementationOnce(() => {
      throw new Error("Corrupted payload");
    });

    const request = new NextRequest("http://localhost:3000/vnpay-return");
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/payment-failed?reason=invalid-data");
  });
});
