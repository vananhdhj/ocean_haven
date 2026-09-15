import { cn, formatMoney, formatDate } from "./utils";

describe("Shared Utils", () => {
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
  });

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
  });

  describe("formatDate", () => {
    it("should format valid ISO date strings to Vietnamese locale format", () => {
      const result = formatDate("2026-09-17");
      expect(result).toMatch(/17/);
      expect(result).toMatch(/9/);
      expect(result).toMatch(/2026/);
    });
  });
});
