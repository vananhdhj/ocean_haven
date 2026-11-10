import { createBooking, cancelMyBooking } from "./bookings";

// --- Mock setup ---
const mockGetUser = jest.fn();
const mockExecProc = jest.fn();

jest.mock("@/shared/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    })
  ),
}));

jest.mock("@/shared/lib/db/sqlserver", () => ({
  execProc: (...args: unknown[]) => mockExecProc(...args),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

// Error raised by THROW 500xx inside dbo.sp_CreateBooking
function sqlBusinessError(number: number, message: string) {
  return Object.assign(new Error(message), { number });
}

// --- Helper: build complete form data ---
function makeFormData(overrides: Record<string, string> = {}): FormData {
  const defaults: Record<string, string> = {
    roomId: "room-001",
    checkIn: "2026-12-01",
    checkOut: "2026-12-05",
    guests: "2",
    name: "John Doe",
    email: "john@example.com",
    phone: "0901234567",
  };
  const formData = new FormData();
  const merged = { ...defaults, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    formData.append(key, value);
  }
  return formData;
}

const loggedInUser = { id: "8c1e5b0e-2f5c-4b8a-9d61-0b1f1b9a7c11", email: "john@example.com" };

// --- Tests ---
describe("Bookings Server Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── VALIDATION ────────────────────────────────────────
  describe("validation", () => {
    it("should fail if required fields are missing", async () => {
      const formData = new FormData();
      formData.append("roomId", "room-001");

      const result = await createBooking(null, formData);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Please fill in all required fields.");
      expect(mockExecProc).not.toHaveBeenCalled();
    });

    it("should fail if user is not authenticated", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const result = await createBooking(null, makeFormData());
      expect(result.success).toBe(false);
      expect(result.message).toBe("You must be logged in to book a room.");
      expect(mockExecProc).not.toHaveBeenCalled();
    });
  });

  // ─── STORED PROCEDURE CALL ─────────────────────────────
  describe("sp_CreateBooking", () => {
    it("should pass the form and user to the procedure and return the booking", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: loggedInUser } });
      mockExecProc.mockResolvedValueOnce([
        [{ id: "42", booking_code: "OH000042", total_price: 8000000, nights: 4 }],
      ]);

      const result = await createBooking(
        null,
        makeFormData({ specialRequests: "Late check-in" })
      );

      expect(mockExecProc).toHaveBeenCalledWith("dbo.sp_CreateBooking", {
        UserId: loggedInUser.id,
        UserEmail: loggedInUser.email,
        RoomId: "room-001",
        CheckIn: "2026-12-01",
        CheckOut: "2026-12-05",
        GuestCount: 2,
        GuestName: "John Doe",
        GuestEmail: "john@example.com",
        GuestPhone: "0901234567",
        SpecialRequests: "Late check-in",
      });
      expect(result).toEqual({
        success: true,
        bookingId: "42",
        bookingCode: "OH000042",
        totalPrice: 8000000, // computed by the database: 4 nights x 2,000,000
      });
    });

    it("should send NULL when there are no special requests", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: loggedInUser } });
      mockExecProc.mockResolvedValueOnce([[{ id: "1", booking_code: "OH000001", total_price: 1 }]]);

      await createBooking(null, makeFormData());

      expect(mockExecProc.mock.calls[0][1].SpecialRequests).toBeNull();
    });
  });

  // ─── BUSINESS RULE ERRORS FROM THE DATABASE ────────────
  describe("business rule errors", () => {
    it.each([
      [50010, "Room is not available for selected dates."],
      [50001, "Check-out date must be after check-in date."],
      [50004, "Room not found."],
      [50005, "This room allows at most 2 guests."],
    ])("should show the procedure's message for error %i", async (number, message) => {
      mockGetUser.mockResolvedValueOnce({ data: { user: loggedInUser } });
      mockExecProc.mockRejectedValueOnce(sqlBusinessError(number, message));

      const result = await createBooking(null, makeFormData());

      expect(result.success).toBe(false);
      expect(result.message).toBe(message);
    });

    it("should hide technical database errors behind a generic message", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: loggedInUser } });
      mockExecProc.mockRejectedValueOnce(
        Object.assign(new Error("Login failed for user 'sa'."), { number: 18456 })
      );

      const result = await createBooking(null, makeFormData());

      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to create booking. Please try again.");
    });
  });

  // ─── CANCEL MY BOOKING ─────────────────────────────────
  describe("cancelMyBooking", () => {
    it("should require login and never call the procedure", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const result = await cancelMyBooking("42");

      expect(result).toEqual({ success: false, message: "You must be logged in to cancel a booking." });
      expect(mockExecProc).not.toHaveBeenCalled();
    });

    it("should pass the session user, not a client-supplied one, to the procedure", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: loggedInUser } });
      mockExecProc.mockResolvedValueOnce([[{ booking_code: "OH000042" }]]);

      const result = await cancelMyBooking("42");

      expect(mockExecProc).toHaveBeenCalledWith("dbo.sp_CancelMyBooking", {
        BookingId: "42",
        UserId: loggedInUser.id,
      });
      expect(result).toEqual({ success: true });
    });

    it.each([
      [50030, "Booking not found."],
      [50031, "This booking can no longer be cancelled."],
      [50032, "Bookings can only be cancelled before the check-in date. Please contact the hotel."],
    ])("should show the procedure's message for error %i", async (number, message) => {
      mockGetUser.mockResolvedValueOnce({ data: { user: loggedInUser } });
      mockExecProc.mockRejectedValueOnce(sqlBusinessError(number, message));

      expect(await cancelMyBooking("42")).toEqual({ success: false, message });
    });

    it("should hide technical database errors behind a generic message", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: loggedInUser } });
      mockExecProc.mockRejectedValueOnce(new Error("connection lost"));

      expect(await cancelMyBooking("42")).toEqual({
        success: false,
        message: "Failed to cancel booking. Please try again.",
      });
    });
  });
});
