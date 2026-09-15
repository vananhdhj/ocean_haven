import { updateBookingStatusAction } from "./admin";

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

describe("Admin Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── updateBookingStatusAction ─────────────────────────
  describe("updateBookingStatusAction", () => {
    it("should fail if bookingId is missing", async () => {
      const result = await updateBookingStatusAction("", "Confirmed");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required fields");
    });

    it("should fail if status is missing", async () => {
      const result = await updateBookingStatusAction("booking-001", "");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required fields");
    });

    it("should fail if user is not authenticated", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const result = await updateBookingStatusAction("booking-001", "Confirmed");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should fail if user is not an admin", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: "user-regular" } },
      });

      // Profile query returns non-admin role
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: { role: "user" } }),
      });

      const result = await updateBookingStatusAction("booking-001", "Confirmed");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Forbidden");
    });

    it("should succeed when admin updates booking status", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: "admin-001" } },
      });

      // Profile query returns admin role
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: { role: "admin" } }),
      });

      // Booking update
      mockFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({ error: null }),
      });

      // History insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValueOnce({ error: null }),
      });

      const result = await updateBookingStatusAction("booking-001", "Confirmed");
      expect(result.success).toBe(true);
    });

    it("should return error when booking update fails", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: "admin-001" } },
      });

      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: { role: "admin" } }),
      });

      // Booking update fails
      mockFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({
          error: { message: "Database constraint violation" },
        }),
      });

      const result = await updateBookingStatusAction("booking-001", "InvalidStatus");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database constraint violation");
    });
  });
});
