/**
 * @jest-environment node
 */
import { GET } from "./route";
import { NextRequest } from "next/server";
import { vnpay } from "@/lib/vnpay";

jest.mock("@/lib/vnpay", () => ({
  vnpay: {
    verifyIpnCall: jest.fn(),
  },
}));

const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockUpsert = jest.fn();

jest.mock("@/shared/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: (table: string) => {
        if (table === "bookings") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: mockSelect,
            update: mockUpdate.mockReturnThis(),
          };
        }
        if (table === "payments") {
          return {
            upsert: mockUpsert,
          };
        }
        return {};
      },
    })
  ),
}));

describe("Integration: GET /api/payments/vnpay-ipn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return RspCode 97 on invalid checksum", async () => {
    (vnpay.verifyIpnCall as jest.Mock).mockReturnValueOnce({
      isVerified: false,
    });

    const request = new NextRequest("http://localhost:3000/api/payments/vnpay-ipn?vnp_SecureHash=bad");
    const response = await GET(request);
    const data = await response.json();

    expect(data.RspCode).toBe("97");
    expect(data.Message).toBe("Checksum failed");
  });

  it("should return RspCode 01 when booking is not found", async () => {
    (vnpay.verifyIpnCall as jest.Mock).mockReturnValueOnce({
      isVerified: true,
      vnp_TxnRef: "NON_EXISTENT_001",
      vnp_Amount: 1000000,
    });
    mockSelect.mockResolvedValueOnce({ data: null });

    const request = new NextRequest("http://localhost:3000/api/payments/vnpay-ipn");
    const response = await GET(request);
    const data = await response.json();

    expect(data.RspCode).toBe("01");
    expect(data.Message).toBe("Order not found");
  });

  it("should return RspCode 04 when amount does not match", async () => {
    (vnpay.verifyIpnCall as jest.Mock).mockReturnValueOnce({
      isVerified: true,
      vnp_TxnRef: "BK123_001",
      vnp_Amount: 500000, // received 500k
    });
    mockSelect.mockResolvedValueOnce({
      data: {
        id: "b-123",
        booking_code: "BK123",
        total_price: 1500000, // expected 1.5M
        status: "Pending",
      },
    });

    const request = new NextRequest("http://localhost:3000/api/payments/vnpay-ipn");
    const response = await GET(request);
    const data = await response.json();

    expect(data.RspCode).toBe("04");
    expect(data.Message).toBe("Invalid amount");
  });

  it("should return RspCode 02 when order is already confirmed", async () => {
    (vnpay.verifyIpnCall as jest.Mock).mockReturnValueOnce({
      isVerified: true,
      vnp_TxnRef: "BK123_001",
      vnp_Amount: 1500000,
    });
    mockSelect.mockResolvedValueOnce({
      data: {
        id: "b-123",
        booking_code: "BK123",
        total_price: 1500000,
        status: "Confirmed",
      },
    });

    const request = new NextRequest("http://localhost:3000/api/payments/vnpay-ipn");
    const response = await GET(request);
    const data = await response.json();

    expect(data.RspCode).toBe("02");
    expect(data.Message).toBe("Order already confirmed");
  });

  it("should confirm order and return RspCode 00 on valid transaction", async () => {
    (vnpay.verifyIpnCall as jest.Mock).mockReturnValueOnce({
      isVerified: true,
      isSuccess: true,
      vnp_TxnRef: "BK123_001",
      vnp_Amount: 1500000,
    });
    mockSelect.mockResolvedValueOnce({
      data: {
        id: "b-123",
        booking_code: "BK123",
        total_price: 1500000,
        status: "Pending",
      },
    });
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValueOnce({ error: null }),
    });
    mockUpsert.mockResolvedValueOnce({ error: null });

    const request = new NextRequest(
      "http://localhost:3000/api/payments/vnpay-ipn?vnp_TransactionNo=141285"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.RspCode).toBe("00");
    expect(data.Message).toBe("Confirm Success");
  });
});
