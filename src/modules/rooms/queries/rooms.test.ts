import { getRooms, getRoomById } from "./rooms";

// --- Chainable mock builder ---
function createChainMock(resolvedData: unknown = null, resolvedError: unknown = null) {
  const result = { data: resolvedData, error: resolvedError, count: null };

  const proxy: Record<string, jest.Mock> = {};
  const methods = ["select", "eq", "not", "lt", "gt", "order", "in", "single", "update"];
  for (const m of methods) {
    proxy[m] = jest.fn().mockReturnValue(proxy);
  }
  // The last method in a chain should resolve
  proxy["single"] = jest.fn().mockResolvedValue(result);
  // For queries that don't end with .single(), make the chain itself thenable
  (proxy as Record<string, unknown>)["then"] = (resolve: (v: unknown) => void) => resolve(result);

  return proxy;
}

// --- Supabase mock ---
const mockFrom = jest.fn();

jest.mock("@/shared/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: mockFrom,
    })
  ),
}));

describe("Rooms Queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getRooms ──────────────────────────────────────────
  describe("getRooms", () => {
    it("should return transformed rooms from Supabase query", async () => {
      const mockRawRooms = [
        {
          id: "room-001",
          name: "Ocean Suite",
          floor: 1,
          rating: 4.8,
          review_count: 25,
          size: 45,
          max_guests: 2,
          bed_count: 1,
          description: "A beautiful ocean-view suite",
          price: 2000000,
          is_active: true,
          room_types: { name: "Suite" },
          view_types: { name: "Ocean View" },
          bed_types: { name: "King" },
          room_images: [
            { image_url: "/img/room1.jpg", is_primary: true },
            { image_url: "/img/room1-2.jpg", is_primary: false },
          ],
          room_amenities: [
            { amenities: { name: "WiFi" } },
            { amenities: { name: "Mini Bar" } },
          ],
        },
      ];

      // First call: cancel expired bookings (from("bookings").update...)
      const updateChain = createChainMock();
      // Second call: rooms query
      const roomsResult = { data: mockRawRooms, error: null };
      const roomsChain: Record<string, jest.Mock> = {};
      const roomsMethods = ["select", "eq", "order"];
      for (const m of roomsMethods) {
        roomsChain[m] = jest.fn().mockReturnValue(roomsChain);
      }
      (roomsChain as Record<string, unknown>)["then"] = (resolve: (v: unknown) => void) =>
        resolve(roomsResult);

      mockFrom
        .mockReturnValueOnce(updateChain) // bookings update
        .mockReturnValueOnce(roomsChain); // rooms select

      const rooms = await getRooms();

      expect(rooms).toHaveLength(1);
      expect(rooms[0].name).toBe("Ocean Suite");
      expect(rooms[0].type).toBe("Suite");
      expect(rooms[0].view).toBe("Ocean View");
      expect(rooms[0].price).toBe(2000000);
      expect(rooms[0].amenities).toEqual(["WiFi", "Mini Bar"]);
      expect(rooms[0].image).toBe("/img/room1.jpg");
      expect(rooms[0].images).toEqual(["/img/room1.jpg", "/img/room1-2.jpg"]);
    });

    it("should return empty array on Supabase error", async () => {
      const updateChain = createChainMock();
      const errorResult = { data: null, error: { message: "Database error" } };
      const roomsChain: Record<string, jest.Mock> = {};
      const roomsMethods = ["select", "eq", "order"];
      for (const m of roomsMethods) {
        roomsChain[m] = jest.fn().mockReturnValue(roomsChain);
      }
      (roomsChain as Record<string, unknown>)["then"] = (resolve: (v: unknown) => void) =>
        resolve(errorResult);

      mockFrom
        .mockReturnValueOnce(updateChain)
        .mockReturnValueOnce(roomsChain);

      const rooms = await getRooms();
      expect(rooms).toEqual([]);
    });

    it("should filter out booked rooms when date params are provided", async () => {
      const mockRawRooms = [
        {
          id: "room-001",
          name: "Room A",
          floor: 1,
          rating: 4.5,
          review_count: 10,
          size: 30,
          max_guests: 2,
          bed_count: 1,
          description: "Room A",
          price: 1000000,
          is_active: true,
          room_types: { name: "Standard" },
          view_types: { name: "City" },
          bed_types: { name: "Queen" },
          room_images: [],
          room_amenities: [],
        },
        {
          id: "room-002",
          name: "Room B",
          floor: 2,
          rating: 4.0,
          review_count: 5,
          size: 25,
          max_guests: 2,
          bed_count: 1,
          description: "Room B",
          price: 800000,
          is_active: true,
          room_types: { name: "Standard" },
          view_types: { name: "Garden" },
          bed_types: { name: "Double" },
          room_images: [],
          room_amenities: [],
        },
      ];

      // Cancel expired bookings mock
      const updateChain = createChainMock();

      // Rooms select
      const roomsResult = { data: mockRawRooms, error: null };
      const roomsChain: Record<string, jest.Mock> = {};
      for (const m of ["select", "eq", "order"]) {
        roomsChain[m] = jest.fn().mockReturnValue(roomsChain);
      }
      (roomsChain as Record<string, unknown>)["then"] = (resolve: (v: unknown) => void) =>
        resolve(roomsResult);

      // Overlapping bookings query → room-002 is booked
      const bookingsResult = { data: [{ room_id: "room-002" }] };
      const bookingsChain: Record<string, jest.Mock> = {};
      for (const m of ["select", "eq", "not", "lt", "gt"]) {
        bookingsChain[m] = jest.fn().mockReturnValue(bookingsChain);
      }
      (bookingsChain as Record<string, unknown>)["then"] = (resolve: (v: unknown) => void) =>
        resolve(bookingsResult);

      mockFrom
        .mockReturnValueOnce(updateChain)   // cancel expired
        .mockReturnValueOnce(roomsChain)    // rooms select
        .mockReturnValueOnce(bookingsChain); // bookings overlap check

      const rooms = await getRooms("2026-10-01", "2026-10-05");

      expect(rooms).toHaveLength(1);
      expect(rooms[0].id).toBe("room-001");
    });

    it("should mark featured rooms correctly", async () => {
      const mockRawRooms = [
        {
          id: "room-001", // This IS in FEATURED_ROOM_IDS
          name: "Featured Room",
          floor: 1,
          rating: 5.0,
          review_count: 50,
          size: 60,
          max_guests: 4,
          bed_count: 2,
          description: "A featured room",
          price: 5000000,
          is_active: true,
          room_types: { name: "VIP" },
          view_types: { name: "Ocean" },
          bed_types: { name: "King" },
          room_images: [],
          room_amenities: [],
        },
        {
          id: "room-999", // This is NOT in FEATURED_ROOM_IDS
          name: "Regular Room",
          floor: 2,
          rating: 3.5,
          review_count: 5,
          size: 20,
          max_guests: 1,
          bed_count: 1,
          description: "A regular room",
          price: 500000,
          is_active: true,
          room_types: { name: "Standard" },
          view_types: { name: "City" },
          bed_types: { name: "Single" },
          room_images: [],
          room_amenities: [],
        },
      ];

      const updateChain = createChainMock();
      const roomsResult = { data: mockRawRooms, error: null };
      const roomsChain: Record<string, jest.Mock> = {};
      for (const m of ["select", "eq", "order"]) {
        roomsChain[m] = jest.fn().mockReturnValue(roomsChain);
      }
      (roomsChain as Record<string, unknown>)["then"] = (resolve: (v: unknown) => void) =>
        resolve(roomsResult);

      mockFrom
        .mockReturnValueOnce(updateChain)
        .mockReturnValueOnce(roomsChain);

      const rooms = await getRooms();

      const featured = rooms.find((r) => r.id === "room-001");
      const regular = rooms.find((r) => r.id === "room-999");
      expect(featured?.featured).toBe(true);
      expect(regular?.featured).toBe(false);
    });
  });

  // ─── getRoomById ───────────────────────────────────────
  describe("getRoomById", () => {
    it("should return null when room is not found", async () => {
      const chain: Record<string, jest.Mock> = {};
      for (const m of ["select", "eq"]) {
        chain[m] = jest.fn().mockReturnValue(chain);
      }
      chain["single"] = jest.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });

      mockFrom.mockReturnValueOnce(chain);

      const room = await getRoomById("nonexistent-room");
      expect(room).toBeNull();
    });

    it("should return transformed room when found", async () => {
      const rawRoom = {
        id: "room-004",
        name: "Garden Villa",
        floor: 1,
        rating: 4.9,
        review_count: 42,
        size: 55,
        max_guests: 3,
        bed_count: 1,
        description: "Beautiful garden villa",
        price: 3500000,
        is_active: true,
        room_types: { name: "Villa" },
        view_types: { name: "Garden" },
        bed_types: { name: "King" },
        room_images: [{ image_url: "/img/villa.jpg", is_primary: true }],
        room_amenities: [{ amenities: { name: "Pool" } }],
      };

      const chain: Record<string, jest.Mock> = {};
      for (const m of ["select", "eq"]) {
        chain[m] = jest.fn().mockReturnValue(chain);
      }
      chain["single"] = jest.fn().mockResolvedValue({ data: rawRoom, error: null });

      mockFrom.mockReturnValueOnce(chain);

      const room = await getRoomById("room-004");
      expect(room).not.toBeNull();
      expect(room!.name).toBe("Garden Villa");
      expect(room!.type).toBe("Villa");
      expect(room!.price).toBe(3500000);
      expect(room!.amenities).toEqual(["Pool"]);
      expect(room!.featured).toBe(true); // room-004 is in FEATURED_ROOM_IDS
    });
  });
});
