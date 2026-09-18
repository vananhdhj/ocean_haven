import { getAdminStats } from "./admin";

// --- Mock setup ---
const mockFrom = jest.fn();

jest.mock("@/shared/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: mockFrom,
    })
  ),
}));

// --- Chainable mock builder for count queries ---
function createCountChain(count: number | null) {
  const chain: Record<string, jest.Mock> = {};
  for (const m of ["select", "eq", "in"]) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  (chain as Record<string, unknown>)["then"] = (resolve: (v: unknown) => void) =>
    resolve({ count, data: null, error: null });
  return chain;
}

function createDataChain(data: unknown[]) {
  const chain: Record<string, jest.Mock> = {};
  for (const m of ["select", "eq"]) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  (chain as Record<string, unknown>)["then"] = (resolve: (v: unknown) => void) =>
    resolve({ data, error: null });
  return chain;
}

describe("Admin Queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getAdminStats ─────────────────────────────────────
  describe("getAdminStats", () => {
    it("should aggregate and return all admin statistics", async () => {
      // Setup mocks for the 7 parallel queries in Promise.all:
      // 1. total_bookings
      mockFrom.mockReturnValueOnce(createCountChain(25));
      // 2. confirmed
      mockFrom.mockReturnValueOnce(createCountChain(15));
      // 3. pending
      mockFrom.mockReturnValueOnce(createCountChain(5));
      // 4. cancelled
      mockFrom.mockReturnValueOnce(createCountChain(3));
      // 5. total_users
      mockFrom.mockReturnValueOnce(createCountChain(100));
      // 6. total_rooms
      mockFrom.mockReturnValueOnce(createCountChain(20));
      // 7. revenue data
      mockFrom.mockReturnValueOnce(
        createDataChain([
          { amount: 2000000 },
          { amount: 3000000 },
          { amount: 1500000 },
        ])
      );

      const stats = await getAdminStats();

      expect(stats.total_bookings).toBe(25);
      expect(stats.confirmed).toBe(15);
      expect(stats.pending).toBe(5);
      expect(stats.cancelled).toBe(3);
      expect(stats.total_users).toBe(100);
      expect(stats.total_rooms).toBe(20);
      expect(stats.total_revenue).toBe(6500000); // 2M + 3M + 1.5M
    });

    it("should handle null counts gracefully (default to 0)", async () => {
      mockFrom.mockReturnValueOnce(createCountChain(null)); // total_bookings
      mockFrom.mockReturnValueOnce(createCountChain(null)); // confirmed
      mockFrom.mockReturnValueOnce(createCountChain(null)); // pending
      mockFrom.mockReturnValueOnce(createCountChain(null)); // cancelled
      mockFrom.mockReturnValueOnce(createCountChain(null)); // total_users
      mockFrom.mockReturnValueOnce(createCountChain(null)); // total_rooms
      mockFrom.mockReturnValueOnce(createDataChain([]));      // no revenue

      const stats = await getAdminStats();

      expect(stats.total_bookings).toBe(0);
      expect(stats.confirmed).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.cancelled).toBe(0);
      expect(stats.total_users).toBe(0);
      expect(stats.total_rooms).toBe(0);
      expect(stats.total_revenue).toBe(0);
    });

    it("should handle null revenue data gracefully", async () => {
      mockFrom.mockReturnValueOnce(createCountChain(10));
      mockFrom.mockReturnValueOnce(createCountChain(5));
      mockFrom.mockReturnValueOnce(createCountChain(3));
      mockFrom.mockReturnValueOnce(createCountChain(2));
      mockFrom.mockReturnValueOnce(createCountChain(50));
      mockFrom.mockReturnValueOnce(createCountChain(15));
      // Revenue query returns null data
      const revenueChain: Record<string, jest.Mock> = {};
      for (const m of ["select", "eq"]) {
        revenueChain[m] = jest.fn().mockReturnValue(revenueChain);
      }
      (revenueChain as Record<string, unknown>)["then"] = (resolve: (v: unknown) => void) =>
        resolve({ data: null, error: { message: "error" } });
      mockFrom.mockReturnValueOnce(revenueChain);

      const stats = await getAdminStats();

      expect(stats.total_revenue).toBe(0);
      expect(stats.total_bookings).toBe(10);
    });
  });
});
