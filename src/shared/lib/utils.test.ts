import { cn, formatMoney, formatDate } from "./utils";

describe("Shared Utils", () => {
  // ─── cn (tailwind-merge) ──────────────────────────────
  describe("cn (class names merger)", () => {
    it("should merge basic class names correctly", () => {
      const result = cn("text-red-500", "bg-blue-500");
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("should resolve Tailwind conflicts preferring later classes", () => {
      const result = cn("p-4", "p-8");
      expect(result).toBe("p-8");
    });

    it("should ignore falsy values (null, undefined, false)", () => {
      const result = cn("text-sm", null, undefined, false, "font-bold");
      expect(result).toBe("text-sm font-bold");
    });

    it("should handle conditional class maps", () => {
      const isPrimary = true;
      const isDisabled = false;
      const result = cn("btn", isPrimary && "btn-primary", isDisabled && "btn-disabled");
      expect(result).toBe("btn btn-primary");
    });

    it("should handle empty input", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("should resolve conflicting text colors", () => {
      const result = cn("text-red-500", "text-blue-500");
      expect(result).toBe("text-blue-500");
    });

    it("should merge non-conflicting Tailwind utilities", () => {
      const result = cn("flex", "items-center", "gap-4", "p-2");
      expect(result).toBe("flex items-center gap-4 p-2");
    });

    it("should resolve conflicting margin/padding with later wins", () => {
      const result = cn("mt-2", "mt-4");
      expect(result).toBe("mt-4");
    });

    it("should handle array of classes via clsx", () => {
      const result = cn(["flex", "gap-2"], "p-4");
      expect(result).toBe("flex gap-2 p-4");
    });
  });

  // ─── formatMoney ──────────────────────────────────────
  describe("formatMoney", () => {
    it("should format amounts to Vietnamese currency format", () => {
      const result = formatMoney(1500000);
      // Normalized check: contains 1.500.000 and currency symbol ₫ or VND
      expect(result).toMatch(/1\.500\.000/);
    });

    it("should handle 0 amount correctly", () => {
      const result = formatMoney(0);
      expect(result).toMatch(/0/);
    });

    it("should format large amounts correctly", () => {
      const result = formatMoney(100000000);
      expect(result).toMatch(/100\.000\.000/);
    });

    it("should format small amounts correctly", () => {
      const result = formatMoney(1000);
      expect(result).toMatch(/1\.000/);
    });

    it("should contain VND currency indicator", () => {
      const result = formatMoney(500000);
      // Vietnamese locale may use ₫ or VND
      expect(result).toMatch(/(₫|VND)/);
    });

    it("should handle negative amounts", () => {
      const result = formatMoney(-500000);
      expect(result).toMatch(/500\.000/);
    });
  });

  // ─── formatDate ───────────────────────────────────────
  describe("formatDate", () => {
    it("should format valid ISO date strings to Vietnamese locale format", () => {
      const result = formatDate("2026-09-17");
      expect(result).toMatch(/17/);
      expect(result).toMatch(/9/);
      expect(result).toMatch(/2026/);
    });

    it("should format ISO datetime strings", () => {
      const result = formatDate("2026-12-25T10:30:00Z");
      expect(result).toMatch(/25/);
      expect(result).toMatch(/12/);
      expect(result).toMatch(/2026/);
    });

    it("should format the first day of year", () => {
      const result = formatDate("2026-01-01");
      expect(result).toMatch(/1/);
      expect(result).toMatch(/2026/);
    });

    it("should format end of year date", () => {
      const result = formatDate("2026-12-31");
      expect(result).toMatch(/31/);
      expect(result).toMatch(/12/);
      expect(result).toMatch(/2026/);
    });
  });
});
