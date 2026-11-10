/**
 * Integration Test: Login → Booking → Pay at the hotel
 *
 * Tests the complete user journey through server actions:
 * 1. User logs in with valid credentials
 * 2. User creates a booking for a room (payment: at the hotel)
 * 3. The booking shows on the profile; the admin confirms it and, after
 *    the stay, marks it Completed, which records the cash as collected
 */

import { login } from "@/modules/auth/actions/auth";
import { createBooking } from "@/modules/bookings/actions/bookings";
import { getUserBookings } from "@/modules/bookings/queries/bookings";
import { updateBookingStatusAction } from "@/modules/admin/actions/admin";

// --- Shared mock state to simulate DB across the flow ---
let mockUser: { id: string; email: string } | null = null;

// --- Supabase mock ---
let mockRole = "user";
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockGetUser = jest.fn();

jest.mock("@/shared/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signUp: mockSignUp,
        signOut: mockSignOut,
        getUser: mockGetUser,
      },
      // users table: role lookup for the admin action
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: mockRole } }) }) }),
      }),
    })
  ),
}));

// --- SQL Server mock (stored procedures) ---
const mockExecProc = jest.fn();

jest.mock("@/shared/lib/db/sqlserver", () => ({
  execProc: (...args: unknown[]) => mockExecProc(...args),
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
      NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    mockRole = "user";
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

      const result = await createBooking(null, formData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("You must be logged in to book a room.");
    });

    it("should successfully create a booking after login", async () => {
      // Simulate user is logged in
      mockUser = { id: "user-flow-001", email: "guest@ocean-haven.com" };
      mockGetUser.mockResolvedValueOnce({ data: { user: mockUser } });

      // sp_CreateBooking: availability, price, booking + payment in one transaction
      mockExecProc.mockResolvedValueOnce([
        [{ id: "booking-flow-001", booking_code: "BFLOW001", total_price: 7500000 }],
      ]);

      const formData = new FormData();
      formData.append("roomId", "room-001");
      formData.append("checkIn", "2026-11-01");
      formData.append("checkOut", "2026-11-04"); // 3 nights
      formData.append("guests", "2");
      formData.append("name", "Nguyen Van A");
      formData.append("email", "guest@ocean-haven.com");
      formData.append("phone", "0901234567");

      const result = await createBooking(null, formData);

      expect(result.success).toBe(true);
      expect(result.bookingId).toBe("booking-flow-001");
      expect(result.bookingCode).toBe("BFLOW001");
      expect(result.totalPrice).toBe(2500000 * 3); // 7,500,000 VND
    });
  });

  // ─── STEP 3: PAY AT THE HOTEL ─────────────────────────
  describe("Step 3: Pay at the hotel", () => {
    const admin = { id: "admin-001", email: "hello@oceanhavenhotel.com" };

    it("shows the new booking on the profile with the payment still pending", async () => {
      mockExecProc.mockResolvedValueOnce([
        [{ id: 42, booking_code: "OH000042", room_name: "Ocean Suite", check_in: "2026-12-20",
           check_out: "2026-12-23", guest_count: 2, status: "Pending", payment_status: "Pending",
           created_at: "2026-11-10T15:00:00Z", total_price: 7500000 }],
      ]);

      const [booking] = await getUserBookings("user-flow-001");

      expect(mockExecProc).toHaveBeenCalledWith("dbo.sp_GetUserBookings", { UserId: "user-flow-001" });
      expect(booking).toMatchObject({ booking_code: "OH000042", status: "Pending", payment_status: "Pending" });
    });

    it("lets the admin confirm, then complete the stay (cash collected)", async () => {
      mockRole = "admin";
      mockGetUser.mockResolvedValue({ data: { user: admin } });
      mockExecProc.mockResolvedValue([[]]);

      expect(await updateBookingStatusAction("42", "Confirmed")).toEqual({ success: true });
      expect(await updateBookingStatusAction("42", "Completed")).toEqual({ success: true });

      // Transition rules and the payment update happen inside the procedure
      expect(mockExecProc).toHaveBeenNthCalledWith(1, "dbo.sp_UpdateBookingStatus", { BookingId: "42", NewStatus: "Confirmed" });
      expect(mockExecProc).toHaveBeenNthCalledWith(2, "dbo.sp_UpdateBookingStatus", { BookingId: "42", NewStatus: "Completed" });
    });

    it("does not let a normal user change the status", async () => {
      mockRole = "user";
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-flow-001" } } });

      expect(await updateBookingStatusAction("42", "Completed")).toEqual({ success: false, error: "Forbidden" });
      expect(mockExecProc).not.toHaveBeenCalled();
    });
  });

  // ─── FULL E2E FLOW ────────────────────────────────────
  describe("Complete Flow: Login → Book → Pay at the hotel", () => {
    it("should complete the entire flow successfully", async () => {
      // ── Step 1: Login ──
      mockSignInWithPassword.mockResolvedValueOnce({ error: null });
      const loginForm = new FormData();
      loginForm.append("email", "guest@ocean-haven.com");
      loginForm.append("password", "securePassword123");
      expect((await login(null, loginForm)).success).toBe(true);

      // ── Step 2: Create Booking ──
      const user = { id: "user-e2e-001", email: "guest@ocean-haven.com" };
      mockGetUser.mockResolvedValueOnce({ data: { user } });
      mockExecProc.mockResolvedValueOnce([
        [{ id: "77", booking_code: "OH000077", total_price: 15000000 }],
      ]);

      const bookingForm = new FormData();
      bookingForm.append("roomId", "room-007");
      bookingForm.append("checkIn", "2026-12-20");
      bookingForm.append("checkOut", "2026-12-25"); // 5 nights
      bookingForm.append("guests", "2");
      bookingForm.append("name", "Nguyen Van A");
      bookingForm.append("email", "guest@ocean-haven.com");
      bookingForm.append("phone", "0901234567");

      const booking = await createBooking(null, bookingForm);
      expect(booking).toMatchObject({ success: true, bookingCode: "OH000077", totalPrice: 15000000 });

      // ── Step 3: Admin completes the stay after the guest paid at the hotel ──
      mockRole = "admin";
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "admin-001" } } });
      mockExecProc.mockResolvedValueOnce([[]]);
      expect(await updateBookingStatusAction(booking.bookingId!, "Completed")).toEqual({ success: true });
      expect(mockExecProc).toHaveBeenLastCalledWith("dbo.sp_UpdateBookingStatus", {
        BookingId: "77",
        NewStatus: "Completed",
      });
    });
  });
});
