/**
 * Integration Test: Login → Booking → Payment Flow
 *
 * Tests the complete user journey through server actions:
 * 1. User logs in with valid credentials
 * 2. User creates a booking for a room
 * 3. User pays via VNPay and the system processes the return
 */

import { login } from "@/modules/auth/actions/auth";
import { createBooking } from "@/modules/bookings/actions/bookings";
import { processVNPayReturn } from "@/modules/payments/actions/payments";
import { buildVnpayUrl } from "@/modules/payments/lib/vnpay";
import { buildPaymentUrlSearchParams, calculateSecureHash, HashAlgorithm } from "vnpay";

function signReturnParams(params: Record<string, string | number>, secret: string): string {
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

// --- Shared mock state to simulate DB across the flow ---
let mockUser: { id: string; email: string } | null = null;
let mockBooking: {
  id: string;
  booking_code: string;
  room_id: string;
  status: string;
  total_price: number;
} | null = null;

// --- Supabase mock ---
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/shared/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signUp: mockSignUp,
        signOut: mockSignOut,
        getUser: mockGetUser,
      },
      from: mockFrom,
    })
  ),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

// --- Test Suite ---
describe("Integration Flow: Login → Booking → Payment", () => {
  const originalEnv = process.env;

  beforeAll(() => {
    process.env = {
      ...originalEnv,
      VNPAY_TMN_CODE: "FLOW_TEST_TMN",
      VNPAY_HASH_SECRET: "FLOW_TEST_SECRET",
      VNPAY_URL: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
      NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    mockBooking = null;
  });

  // ─── STEP 1: LOGIN ────────────────────────────────────
  describe("Step 1: User Login", () => {
    it("should reject login with missing credentials", async () => {
      const formData = new FormData();
      const result = await login(null, formData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Please enter both email and password.");
    });

    it("should successfully login with valid credentials", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({ error: null });

      const formData = new FormData();
      formData.append("email", "guest@ocean-haven.com");
      formData.append("password", "securePassword123");

      const result = await login(null, formData);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Login successful.");

      // Simulate authenticated user is now available
      mockUser = { id: "user-flow-001", email: "guest@ocean-haven.com" };
    });
  });

  // ─── STEP 2: BOOKING ──────────────────────────────────
  describe("Step 2: Create Booking", () => {
    it("should reject booking when user is not logged in", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const formData = new FormData();
      formData.append("roomId", "room-001");
      formData.append("checkIn", "2026-11-01");
      formData.append("checkOut", "2026-11-04");
      formData.append("guests", "2");
      formData.append("name", "Nguyen Van A");
      formData.append("email", "guest@ocean-haven.com");
      formData.append("phone", "0901234567");
      formData.append("paymentMethod", "vnpay");

      const result = await createBooking(null, formData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("You must be logged in to book a room.");
    });

    it("should successfully create a booking after login", async () => {
      // Simulate user is logged in
      mockUser = { id: "user-flow-001", email: "guest@ocean-haven.com" };
      mockGetUser.mockResolvedValueOnce({ data: { user: mockUser } });

      // No overlapping bookings
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        gt: jest.fn().mockResolvedValueOnce({ data: [] }),
      });

      // Room price lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: { price: 2500000 } }),
      });

      // Booking insert
      const bookingData = {
        id: "booking-flow-001",
        booking_code: "BFLOW001",
      };
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: bookingData, error: null }),
      });

      // Payment insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValueOnce({ error: null }),
      });

      const formData = new FormData();
      formData.append("roomId", "room-001");
      formData.append("checkIn", "2026-11-01");
      formData.append("checkOut", "2026-11-04"); // 3 nights
      formData.append("guests", "2");
      formData.append("name", "Nguyen Van A");
      formData.append("email", "guest@ocean-haven.com");
      formData.append("phone", "0901234567");
      formData.append("paymentMethod", "vnpay");

      const result = await createBooking(null, formData);

      expect(result.success).toBe(true);
      expect(result.bookingId).toBe("booking-flow-001");
      expect(result.bookingCode).toBe("BFLOW001");
      expect(result.totalPrice).toBe(2500000 * 3); // 7,500,000 VND
      expect(result.paymentMethod).toBe("vnpay");

      // Store for next step
      mockBooking = {
        id: result.bookingId!,
        booking_code: result.bookingCode!,
        room_id: "room-001",
        status: "Pending",
        total_price: result.totalPrice!,
      };
    });
  });

  // ─── STEP 3: PAYMENT ──────────────────────────────────
  describe("Step 3: VNPay Payment", () => {
    beforeEach(() => {
      // Pre-set booking data for payment step
      mockBooking = {
        id: "booking-flow-001",
        booking_code: "BFLOW001",
        room_id: "room-001",
        status: "Pending",
        total_price: 7500000,
      };
    });

    it("should build a valid VNPay URL from booking data", () => {
      const vnpayUrl = buildVnpayUrl(
        mockBooking!.total_price,
        mockBooking!.booking_code,
        `${mockBooking!.booking_code}_${Date.now()}`
      );

      const url = new URL(vnpayUrl);

      expect(url.origin + url.pathname).toBe(
        "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
      );
      expect(url.searchParams.get("vnp_Amount")).toBe("750000000"); // 7.5M * 100
      expect(url.searchParams.get("vnp_OrderInfo")).toContain("BFLOW001");
      expect(url.searchParams.get("vnp_SecureHash")).toBeDefined();
      expect(url.searchParams.get("vnp_SecureHash")!.length).toBe(128);
    });

    it("should process successful VNPay return and confirm booking", async () => {
      // Simulate VNPay callback params with valid signature
      const vnpParams: Record<string, string> = {
        vnp_Amount: "750000000", // 7,500,000 * 100
        vnp_BankCode: "NCB",
        vnp_CardType: "ATM",
        vnp_OrderInfo: `Thanh toan dat phong Ocean Haven: ${mockBooking!.booking_code}`,
        vnp_ResponseCode: "00", // success
        vnp_TmnCode: "FLOW_TEST_TMN",
        vnp_TransactionNo: "14128523",
        vnp_TxnRef: mockBooking!.booking_code,
      };

      const validHash = signReturnParams(vnpParams, "FLOW_TEST_SECRET");

      const callbackParams = {
        ...vnpParams,
        vnp_SecureHash: validHash,
      };

      // Mock: update booking status
      mockFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({ error: null }),
      });

      // Mock: find booking by code
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { id: mockBooking!.id },
        }),
      });

      // Mock: upsert payment
      mockFrom.mockReturnValueOnce({
        upsert: jest.fn().mockResolvedValueOnce({ error: null }),
      });

      const result = await processVNPayReturn(callbackParams);

      expect(result.isValid).toBe(true);
      expect(result.isSuccess).toBe(true);
      expect(result.bookingCode).toBe(mockBooking!.booking_code);
      expect(result.amount).toBe(7500000); // VNPay amount / 100
      expect(result.responseCode).toBe("00");
      expect(result.transactionNo).toBe("14128523");

      // Verify booking was updated to "Confirmed"
      expect(mockFrom).toHaveBeenCalledWith("bookings");
    });

    it("should handle failed VNPay payment (user cancelled)", async () => {
      const vnpParams: Record<string, string> = {
        vnp_Amount: "750000000",
        vnp_ResponseCode: "24", // user cancelled
        vnp_TmnCode: "FLOW_TEST_TMN",
        vnp_TxnRef: mockBooking!.booking_code,
      };

      const validHash = signReturnParams(vnpParams, "FLOW_TEST_SECRET");

      const result = await processVNPayReturn({
        ...vnpParams,
        vnp_SecureHash: validHash,
      });

      // Signature is valid, but response is not "00" → isSuccess = false
      expect(result.isValid).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.responseCode).toBe("24");
    });

    it("should reject tampered VNPay callback", async () => {
      const result = await processVNPayReturn({
        vnp_Amount: "999999999",
        vnp_ResponseCode: "00",
        vnp_TxnRef: mockBooking!.booking_code,
        vnp_SecureHash: "totally_fake_hash",
      });

      expect(result.isValid).toBe(false);
      expect(result.isSuccess).toBe(false);
    });
  });

  // ─── FULL E2E FLOW ────────────────────────────────────
  describe("Complete Flow: Login → Book → Pay", () => {
    it("should complete the entire flow successfully", async () => {
      // ── Step 1: Login ──
      mockSignInWithPassword.mockResolvedValueOnce({ error: null });

      const loginForm = new FormData();
      loginForm.append("email", "guest@ocean-haven.com");
      loginForm.append("password", "securePassword123");

      const loginResult = await login(null, loginForm);
      expect(loginResult.success).toBe(true);

      // ── Step 2: Create Booking ──
      const user = { id: "user-e2e-001", email: "guest@ocean-haven.com" };
      mockGetUser.mockResolvedValueOnce({ data: { user } });

      // No overlapping bookings
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        gt: jest.fn().mockResolvedValueOnce({ data: [] }),
      });

      // Room price
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: { price: 3000000 } }),
      });

      // Booking insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { id: "booking-e2e-001", booking_code: "BE2E001" },
          error: null,
        }),
      });

      // Payment record insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValueOnce({ error: null }),
      });

      const bookingForm = new FormData();
      bookingForm.append("roomId", "room-007");
      bookingForm.append("checkIn", "2026-12-20");
      bookingForm.append("checkOut", "2026-12-25"); // 5 nights
      bookingForm.append("guests", "2");
      bookingForm.append("name", "Nguyen Van A");
      bookingForm.append("email", "guest@ocean-haven.com");
      bookingForm.append("phone", "0901234567");
      bookingForm.append("paymentMethod", "vnpay");

      const bookingResult = await createBooking(null, bookingForm);
      expect(bookingResult.success).toBe(true);
      expect(bookingResult.totalPrice).toBe(15000000); // 3M × 5 nights
      expect(bookingResult.paymentMethod).toBe("vnpay");

      // ── Step 3: Build VNPay URL ──
      const vnpayUrl = buildVnpayUrl(
        bookingResult.totalPrice!,
        bookingResult.bookingCode!,
        `${bookingResult.bookingCode}_${Date.now()}`
      );

      const parsedUrl = new URL(vnpayUrl);
      expect(parsedUrl.searchParams.get("vnp_Amount")).toBe("1500000000");

      // ── Step 4: Process VNPay Return ──
      const vnpParams: Record<string, string> = {
        vnp_Amount: "1500000000",
        vnp_BankCode: "VNPAY",
        vnp_OrderInfo: `Thanh toan dat phong Ocean Haven: ${bookingResult.bookingCode}`,
        vnp_ResponseCode: "00",
        vnp_TmnCode: "FLOW_TEST_TMN",
        vnp_TransactionNo: "99887766",
        vnp_TxnRef: bookingResult.bookingCode!,
      };

      const hash = signReturnParams(vnpParams, "FLOW_TEST_SECRET");

      // Mock DB updates for payment processing
      mockFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({ error: null }),
      });
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { id: "booking-e2e-001" },
        }),
      });
      mockFrom.mockReturnValueOnce({
        upsert: jest.fn().mockResolvedValueOnce({ error: null }),
      });

      const paymentResult = await processVNPayReturn({
        ...vnpParams,
        vnp_SecureHash: hash,
      });

      expect(paymentResult.isValid).toBe(true);
      expect(paymentResult.isSuccess).toBe(true);
      expect(paymentResult.amount).toBe(15000000);
      expect(paymentResult.bookingCode).toBe(bookingResult.bookingCode);
    });
  });
});
