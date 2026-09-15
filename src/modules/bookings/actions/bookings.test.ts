import { createBooking } from "./bookings";

// --- Mock setup ---
const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/shared/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    })
  ),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

// --- Helper: build complete form data ---
function makeFormData(overrides: Record<string, string> = {}): FormData {
  const defaults: Record<string, string> = {
    roomId: "room-001",
    checkIn: "2026-10-01",
    checkOut: "2026-10-05",
    guests: "2",
    name: "John Doe",
    email: "john@example.com",
    phone: "0901234567",
    paymentMethod: "cash",
  };
  const formData = new FormData();
  const merged = { ...defaults, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    formData.append(key, value);
  }
  return formData;
}

// --- Tests ---
describe("Bookings Server Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── VALIDATION ────────────────────────────────────────
  describe("validation", () => {
    it("should fail if required fields are missing", async () => {
      const formData = new FormData();
      formData.append("roomId", "room-001");

      const result = await createBooking(null, formData);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Please fill in all required fields.");
    });

    it("should fail if user is not authenticated", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const result = await createBooking(null, makeFormData());
      expect(result.success).toBe(false);
      expect(result.message).toBe("You must be logged in to book a room.");
    });
  });

  // ─── ROOM CONFLICT ────────────────────────────────────
  describe("room conflict detection", () => {
    it("should fail when room has overlapping bookings", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: "user-123", email: "john@example.com" } },
      });

      // Overlapping bookings query → returns existing booking (conflict!)
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        gt: jest.fn().mockResolvedValueOnce({
          data: [{ id: "existing-booking-001" }],
        }),
      });

      const result = await createBooking(null, makeFormData());
      expect(result.success).toBe(false);
      expect(result.message).toBe("Room is not available for selected dates.");
    });
  });

  // ─── INVALID DATE ──────────────────────────────────────
  describe("invalid date handling", () => {
    it("should fail if check-out date is before check-in date", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: "user-123", email: "john@example.com" } },
      });

      // Overlapping bookings → none (available)
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        gt: jest.fn().mockResolvedValueOnce({ data: [] }),
      });

      // Room query → price
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: { price: 1000000 } }),
      });

      const result = await createBooking(
        null,
        makeFormData({
          checkIn: "2026-10-05",
          checkOut: "2026-10-01", // checkout before checkin
        })
      );
      expect(result.success).toBe(false);
      expect(result.message).toBe("Check-out date must be after check-in date.");
    });

    it("should fail if check-in and check-out are the same date (0 nights)", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: "user-123", email: "john@example.com" } },
      });

      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        gt: jest.fn().mockResolvedValueOnce({ data: [] }),
      });

      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: { price: 1000000 } }),
      });

      const result = await createBooking(
        null,
        makeFormData({
          checkIn: "2026-10-05",
          checkOut: "2026-10-05", // same date
        })
      );
      expect(result.success).toBe(false);
      expect(result.message).toBe("Check-out date must be after check-in date.");
    });
  });

  // ─── NIGHTS & TOTAL CALCULATION ────────────────────────
  describe("nights and total price calculation", () => {
    it("should correctly calculate 4 nights and total amount", async () => {
      const pricePerNight = 2000000;

      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: "user-123", email: "john@example.com" } },
      });

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
        single: jest.fn().mockResolvedValueOnce({ data: { price: pricePerNight } }),
      });

      // Booking insert
      const mockBooking = {
        id: "booking-123",
        booking_code: "B123456",
      };
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: mockBooking, error: null }),
      });

      // Payment insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValueOnce({ error: null }),
      });

      const result = await createBooking(
        null,
        makeFormData({
          checkIn: "2026-10-01",
          checkOut: "2026-10-05", // 4 nights
        })
      );

      expect(result.success).toBe(true);
      expect(result.totalPrice).toBe(pricePerNight * 4); // 8,000,000 VND
      expect(result.bookingId).toBe("booking-123");
      expect(result.bookingCode).toBe("B123456");
    });

    it("should correctly calculate 1 night stay", async () => {
      const pricePerNight = 1500000;

      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: "user-456", email: "user@example.com" } },
      });

      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        gt: jest.fn().mockResolvedValueOnce({ data: [] }),
      });

      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: { price: pricePerNight } }),
      });

      const mockBooking = { id: "booking-456", booking_code: "B654321" };
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: mockBooking, error: null }),
      });

      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValueOnce({ error: null }),
      });

      const result = await createBooking(
        null,
        makeFormData({
          checkIn: "2026-10-01",
          checkOut: "2026-10-02", // 1 night
        })
      );

      expect(result.success).toBe(true);
      expect(result.totalPrice).toBe(pricePerNight * 1); // 1,500,000 VND
    });

    it("should fail when room is not found in price lookup", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: "user-123", email: "john@example.com" } },
      });

      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        gt: jest.fn().mockResolvedValueOnce({ data: [] }),
      });

      // Room not found
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: null }),
      });

      const result = await createBooking(null, makeFormData());
      expect(result.success).toBe(false);
      expect(result.message).toBe("Room not found.");
    });
  });
});
