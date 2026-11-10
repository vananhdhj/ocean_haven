import { execProc } from "@/shared/lib/db/sqlserver";
import { embedTexts, EMBEDDING_MODEL } from "../lib/embeddings";
import { getRooms } from "./rooms";
import { Room } from "../types";

/**
 * Embeds every room that has no vector yet: new rooms, or rooms whose
 * text/amenities changed (triggers delete the stale vector).
 * A no-op single query once all rooms are embedded.
 */
export async function syncRoomEmbeddings(): Promise<number> {
  const [missing] = await execProc<{ room_id: string; content: string }>(
    "dbo.sp_GetRoomsMissingEmbedding"
  );
  if (!missing?.length) return 0;

  const vectors = await embedTexts(missing.map((m) => m.content));
  for (const [i, room] of missing.entries()) {
    await execProc("dbo.sp_UpsertRoomEmbedding", {
      RoomId: room.room_id,
      Embedding: JSON.stringify(vectors[i]),
      Model: EMBEDDING_MODEL,
    });
  }
  return missing.length;
}

/**
 * AI semantic search: rooms ranked by how close their meaning is to the
 * guest's free-text description, restricted to rooms available for the dates.
 */
export async function searchRoomsSemantic(
  query: string,
  checkin?: string,
  checkout?: string
): Promise<Room[]> {
  await syncRoomEmbeddings();

  const [queryVector] = await embedTexts([query]);
  const [matches] = await execProc<{ room_id: string; similarity: number }>(
    "dbo.sp_SemanticSearchRooms",
    { QueryEmbedding: JSON.stringify(queryVector), CheckIn: checkin, CheckOut: checkout }
  );
  if (!matches?.length) return [];

  const rooms = new Map((await getRooms(checkin, checkout)).map((r) => [r.id, r]));
  return matches.flatMap((m) => {
    const room = rooms.get(m.room_id);
    return room ? [{ ...room, similarity: m.similarity }] : [];
  });
}
