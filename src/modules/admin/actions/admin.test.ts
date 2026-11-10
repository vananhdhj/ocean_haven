import { updateBookingStatusAction } from "./admin";

// --- Mock setup ---
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockExecProc = jest.fn();

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

jest.mock("@/shared/lib/db/sqlserver", () => ({
  execProc: (...args: unknown[]) => mockExecProc(...args),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

function mockRole(role: string) {
  mockFrom.mockReturnValueOnce({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValueOnce({ data: { role } }),
  });
}

describe("Admin Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── updateBookingStatusAction ─────────────────────────
  describe("updateBookingStatusAction", () => {
    it("should fail if bookingId is missing", async () => {
      const result = await updateBookingStatusAction("", "Confirmed");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required fields");
    });

    it("should fail if status is missing", async () => {
      const result = await updateBookingStatusAction("17", "");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required fields");
    });

    it("should fail if user is not authenticated", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const result = await updateBookingStatusAction("17", "Confirmed");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should fail if user is not an admin", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-regular" } } });
      mockRole("user");

      const result = await updateBookingStatusAction("17", "Confirmed");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Forbidden");
      expect(mockExecProc).not.toHaveBeenCalled();
    });

    it("should call sp_UpdateBookingStatus when an admin updates a booking", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "admin-001" } } });
      mockRole("admin");
      mockExecProc.mockResolvedValueOnce([]);

      const result = await updateBookingStatusAction("17", "Confirmed");

      expect(result.success).toBe(true);
      expect(mockExecProc).toHaveBeenCalledWith("dbo.sp_UpdateBookingStatus", {
        BookingId: "17",
        NewStatus: "Confirmed",
      });
    });

    it("should return the procedure's message for a forbidden transition", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "admin-001" } } });
      mockRole("admin");
      mockExecProc.mockRejectedValueOnce(
        Object.assign(new Error("Cannot change booking status from Cancelled to Confirmed."), {
          number: 50022,
        })
      );

      const result = await updateBookingStatusAction("17", "Confirmed");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Cannot change booking status from Cancelled to Confirmed.");
    });

    it("should return a generic error for technical failures", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "admin-001" } } });
      mockRole("admin");
      mockExecProc.mockRejectedValueOnce(new Error("Connection lost"));

      const result = await updateBookingStatusAction("17", "Confirmed");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to update booking status");
    });
  });
});
