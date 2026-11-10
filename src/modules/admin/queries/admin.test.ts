import { getAdminStats, getAdminBookings } from "./admin";

// --- Mock setup ---
const mockFrom = jest.fn();
const mockExecProc = jest.fn();

jest.mock("@/shared/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: mockFrom,
    })
  ),
}));

jest.mock("@/shared/lib/db/sqlserver", () => ({
  execProc: (...args: unknown[]) => mockExecProc(...args),
}));

// Supabase user count query: from("users").select(..., { count }).eq("role", "user")
function mockUserCount(count: number | null) {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockResolvedValue({ count, data: null, error: null });
  mockFrom.mockReturnValueOnce(chain);
}

describe("Admin Queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── getAdminStats ─────────────────────────────────────
  describe("getAdminStats", () => {
    it("should combine SQL Server booking stats with the Supabase user count", async () => {
      mockExecProc.mockResolvedValueOnce([
        [
          {
            total_bookings: 25,
            confirmed: 15,
            pending: 5,
            cancelled: 3,
            total_revenue: 6500000,
            total_rooms: 20,
          },
        ],
      ]);
      mockUserCount(100);

      const stats = await getAdminStats();

      expect(mockExecProc).toHaveBeenCalledWith("dbo.sp_GetAdminStats");
      expect(mockFrom).toHaveBeenCalledWith("users");
      expect(stats).toEqual({
        total_bookings: 25,
        confirmed: 15,
        pending: 5,
        cancelled: 3,
        total_users: 100,
        total_revenue: 6500000,
        total_rooms: 20,
      });
    });

    it("should default a null user count to 0", async () => {
      mockExecProc.mockResolvedValueOnce([
        [{ total_bookings: 0, confirmed: 0, pending: 0, cancelled: 0, total_revenue: 0, total_rooms: 22 }],
      ]);
      mockUserCount(null);

      const stats = await getAdminStats();

      expect(stats.total_users).toBe(0);
      expect(stats.total_revenue).toBe(0);
    });
  });

  // ─── getAdminBookings ──────────────────────────────────
  describe("getAdminBookings", () => {
    const row = {
      id: "7",
      booking_code: "OH000007",
      guest_name: "Nguyen Van A",
      guest_phone: "0901234567",
      check_in: "2026-12-20",
      check_out: "2026-12-25",
      total_price: 15000000,
      status: "Confirmed",
      created_at: "2026-11-10T08:00:00Z",
      room_name: "Seaside Family Suite",
      user_email: "guest@oceanhaven.vn",
      payment_status: "Completed",
    };

    it("should map procedure rows to AdminBooking", async () => {
      mockExecProc.mockResolvedValueOnce([[row]]);

      const [booking] = await getAdminBookings();

      expect(mockExecProc).toHaveBeenCalledWith("dbo.sp_GetAdminBookings", { PhoneSearch: null });
      expect(booking.booking_id).toBe("7");
      expect(booking.room_name).toBe("Seaside Family Suite");
      expect(booking.payment_status).toBe("Completed");
      expect(booking).not.toHaveProperty("id");
    });

    it("should pass a trimmed phone prefix to the procedure", async () => {
      mockExecProc.mockResolvedValueOnce([[]]);

      await getAdminBookings("  0901 ");

      expect(mockExecProc).toHaveBeenCalledWith("dbo.sp_GetAdminBookings", { PhoneSearch: "0901" });
    });

    it("should return empty array on database error", async () => {
      mockExecProc.mockRejectedValueOnce(new Error("timeout"));

      expect(await getAdminBookings()).toEqual([]);
    });
  });
});
