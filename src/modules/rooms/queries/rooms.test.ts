import { getRooms, getRoomById } from "./rooms";

// --- SQL Server mock ---
const mockExecProc = jest.fn();

jest.mock("@/shared/lib/db/sqlserver", () => ({
  execProc: (...args: unknown[]) => mockExecProc(...args),
}));

jest.mock("next/server", () => ({
  connection: jest.fn(),
}));

// sp_GetRooms returns one row with the rooms as a JSON document
function roomsResult(rooms: unknown[] | null) {
  return [[{ rooms_json: rooms === null ? null : JSON.stringify(rooms) }]];
}

function rawRoom(overrides: Record<string, unknown> = {}) {
  return {
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
    room_type: "Suite",
    view_type: "Ocean View",
    bed_type: "King",
    images: [
      { image_url: "/img/room1-2.jpg", is_primary: false },
      { image_url: "/img/room1.jpg", is_primary: true },
    ],
    amenities: [{ name: "WiFi" }, { name: "Mini Bar" }],
    ...overrides,
  };
}

describe("Rooms Queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── getRooms ──────────────────────────────────────────
  describe("getRooms", () => {
    it("should return transformed rooms", async () => {
      mockExecProc.mockResolvedValueOnce(roomsResult([rawRoom()])); // sp_GetRooms

      const rooms = await getRooms();

      expect(mockExecProc).toHaveBeenCalledWith("dbo.sp_GetRooms", {
        CheckIn: undefined,
        CheckOut: undefined,
      });
      expect(rooms).toHaveLength(1);
      expect(rooms[0].name).toBe("Ocean Suite");
      expect(rooms[0].type).toBe("Suite");
      expect(rooms[0].view).toBe("Ocean View");
      expect(rooms[0].price).toBe(2000000);
      expect(rooms[0].amenities).toEqual(["WiFi", "Mini Bar"]);
      expect(rooms[0].image).toBe("/img/room1.jpg"); // primary image wins
      expect(rooms[0].images).toEqual(["/img/room1-2.jpg", "/img/room1.jpg"]);
    });

    it("should pass the dates to sp_GetRooms, which filters out booked rooms", async () => {
      mockExecProc
        .mockResolvedValueOnce(roomsResult([rawRoom()]));

      await getRooms("2026-10-01", "2026-10-05");

      expect(mockExecProc).toHaveBeenCalledWith("dbo.sp_GetRooms", {
        CheckIn: "2026-10-01",
        CheckOut: "2026-10-05",
      });
    });

    it("should return empty array on database error", async () => {
      mockExecProc
        .mockRejectedValueOnce(new Error("Database error"));

      const rooms = await getRooms();
      expect(rooms).toEqual([]);
    });

    it("should return empty array when no room matches (NULL JSON)", async () => {
      mockExecProc
        .mockResolvedValueOnce(roomsResult(null));

      const rooms = await getRooms("2026-10-01", "2026-10-05");
      expect(rooms).toEqual([]);
    });

    it("should default missing optional fields (FOR JSON omits NULLs)", async () => {
      const { images, amenities, room_type, ...bare } = rawRoom();
      void images;
      void amenities;
      void room_type;
      mockExecProc
        .mockResolvedValueOnce(roomsResult([bare]));

      const [room] = await getRooms();
      expect(room.type).toBe("");
      expect(room.image).toBe("");
      expect(room.images).toEqual([]);
      expect(room.amenities).toEqual([]);
    });

    it("should mark featured rooms correctly", async () => {
      mockExecProc
        .mockResolvedValueOnce(
          roomsResult([
            rawRoom({ id: "room-001" }), // in FEATURED_ROOM_IDS
            rawRoom({ id: "room-999" }), // not featured
          ])
        );

      const rooms = await getRooms();

      expect(rooms.find((r) => r.id === "room-001")?.featured).toBe(true);
      expect(rooms.find((r) => r.id === "room-999")?.featured).toBe(false);
    });
  });

  // ─── getRoomById ───────────────────────────────────────
  describe("getRoomById", () => {
    it("should return null when room is not found", async () => {
      mockExecProc.mockResolvedValueOnce(roomsResult(null));

      const room = await getRoomById("nonexistent-room");

      expect(mockExecProc).toHaveBeenCalledWith("dbo.sp_GetRooms", { RoomId: "nonexistent-room" });
      expect(room).toBeNull();
    });

    it("should return null on database error", async () => {
      mockExecProc.mockRejectedValueOnce(new Error("Database error"));

      const room = await getRoomById("room-004");
      expect(room).toBeNull();
    });

    it("should return transformed room when found", async () => {
      mockExecProc.mockResolvedValueOnce(
        roomsResult([
          rawRoom({
            id: "room-004",
            name: "Garden Villa",
            room_type: "Villa",
            price: 3500000,
            amenities: [{ name: "Pool" }],
          }),
        ])
      );

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
