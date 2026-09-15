import { createBooking } from "./bookings";

const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/shared/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("Bookings Server Actions Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fail if required fields are missing", async () => {
    const formData = new FormData();
    formData.append("roomId", "room-001");
    // missing checkIn, checkOut, name, etc.

    const result = await createBooking(null, formData);
    expect(result.success).toBe(false);
    expect(result.message).toBe("Please fill in all required fields.");
  });

  it("should fail if user is not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const formData = new FormData();
    formData.append("roomId", "room-001");
    formData.append("checkIn", "2026-10-01");
    formData.append("checkOut", "2026-10-05");
    formData.append("guests", "2");
    formData.append("name", "John Doe");
    formData.append("email", "john@example.com");
    formData.append("phone", "0901234567");

    const result = await createBooking(null, formData);
    expect(result.success).toBe(false);
    expect(result.message).toBe("You must be logged in to book a room.");
  });

  it("should fail if check-out date is before or equal to check-in date", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "john@example.com" } },
    });

    // Mock overlapping bookings query returning empty (available)
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      gt: jest.fn().mockResolvedValueOnce({ data: [] }),
    });

    // Mock room query returning room details
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({ data: { price: 1000000 } }),
    });

    const formData = new FormData();
    formData.append("roomId", "room-001");
    formData.append("checkIn", "2026-10-05");
    formData.append("checkOut", "2026-10-01"); // Invalid: check-out before check-in
    formData.append("guests", "2");
    formData.append("name", "John Doe");
    formData.append("email", "john@example.com");
    formData.append("phone", "0901234567");

    const result = await createBooking(null, formData);
    expect(result.success).toBe(false);
    expect(result.message).toBe("Check-out date must be after check-in date.");
  });
});
