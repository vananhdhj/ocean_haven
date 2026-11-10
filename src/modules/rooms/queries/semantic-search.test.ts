import { searchRoomsSemantic, syncRoomEmbeddings } from "./semantic-search";
import type { Room } from "../types";

const mockExecProc = jest.fn();
const mockEmbedTexts = jest.fn();
const mockGetRooms = jest.fn();

jest.mock("@/shared/lib/db/sqlserver", () => ({
  execProc: (...args: unknown[]) => mockExecProc(...args),
}));

jest.mock("../lib/embeddings", () => ({
  EMBEDDING_MODEL: "bge-m3",
  embedTexts: (...args: unknown[]) => mockEmbedTexts(...args),
}));

jest.mock("./rooms", () => ({
  getRooms: (...args: unknown[]) => mockGetRooms(...args),
}));

function room(id: string): Room {
  return {
    id,
    name: `Room ${id}`,
    type: "Deluxe",
    floor: 1,
    view: "Sea View",
    price: 1000000,
    rating: 4.5,
    reviewCount: 10,
    maxGuests: 2,
    beds: 1,
    bedType: "King",
    size: 30,
    image: "",
    images: [],
    description: "",
    amenities: [],
    featured: false,
  };
}

describe("Semantic search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("syncRoomEmbeddings", () => {
    it("should do nothing when every room already has a vector", async () => {
      mockExecProc.mockResolvedValueOnce([[]]); // sp_GetRoomsMissingEmbedding

      const count = await syncRoomEmbeddings();

      expect(count).toBe(0);
      expect(mockEmbedTexts).not.toHaveBeenCalled();
      expect(mockExecProc).toHaveBeenCalledTimes(1);
    });

    it("should embed missing rooms in one batch and store each vector", async () => {
      mockExecProc.mockResolvedValueOnce([
        [
          { room_id: "room-001", content: "Ocean Breeze Standard. Sea View..." },
          { room_id: "room-002", content: "Garden Sanctuary. Garden View..." },
        ],
      ]);
      mockExecProc.mockResolvedValue([[]]); // sp_UpsertRoomEmbedding
      mockEmbedTexts.mockResolvedValueOnce([
        [0.1, 0.2],
        [0.3, 0.4],
      ]);

      const count = await syncRoomEmbeddings();

      expect(count).toBe(2);
      expect(mockEmbedTexts).toHaveBeenCalledWith([
        "Ocean Breeze Standard. Sea View...",
        "Garden Sanctuary. Garden View...",
      ]);
      expect(mockExecProc).toHaveBeenCalledWith("dbo.sp_UpsertRoomEmbedding", {
        RoomId: "room-001",
        Embedding: "[0.1,0.2]",
        Model: "bge-m3",
      });
      expect(mockExecProc).toHaveBeenCalledWith("dbo.sp_UpsertRoomEmbedding", {
        RoomId: "room-002",
        Embedding: "[0.3,0.4]",
        Model: "bge-m3",
      });
    });
  });

  describe("searchRoomsSemantic", () => {
    it("should return available rooms in similarity order with their score", async () => {
      mockExecProc
        .mockResolvedValueOnce([[]]) // nothing to embed
        .mockResolvedValueOnce([
          [
            { room_id: "room-013", similarity: 0.71 },
            { room_id: "room-009", similarity: 0.64 },
          ],
        ]); // sp_SemanticSearchRooms
      mockEmbedTexts.mockResolvedValueOnce([[0.5, 0.6]]);
      mockGetRooms.mockResolvedValueOnce([room("room-009"), room("room-013"), room("room-001")]);

      const rooms = await searchRoomsSemantic("romantic sea view", "2026-12-01", "2026-12-03");

      expect(mockEmbedTexts).toHaveBeenCalledWith(["romantic sea view"]);
      expect(mockExecProc).toHaveBeenLastCalledWith("dbo.sp_SemanticSearchRooms", {
        QueryEmbedding: "[0.5,0.6]",
        CheckIn: "2026-12-01",
        CheckOut: "2026-12-03",
      });
      expect(mockGetRooms).toHaveBeenCalledWith("2026-12-01", "2026-12-03");
      expect(rooms.map((r) => r.id)).toEqual(["room-013", "room-009"]);
      expect(rooms[0].similarity).toBe(0.71);
    });

    it("should return no rooms when nothing is similar enough", async () => {
      mockExecProc.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);
      mockEmbedTexts.mockResolvedValueOnce([[0.5, 0.6]]);

      const rooms = await searchRoomsSemantic("asdfgh");

      expect(rooms).toEqual([]);
      expect(mockGetRooms).not.toHaveBeenCalled();
    });

    it("should propagate embedding failures so the page can fall back", async () => {
      mockExecProc.mockResolvedValueOnce([[]]);
      mockEmbedTexts.mockRejectedValueOnce(new Error("Ollama is not running"));

      await expect(searchRoomsSemantic("sea view")).rejects.toThrow("Ollama is not running");
    });
  });
});
