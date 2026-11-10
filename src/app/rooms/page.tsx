import { getRooms, searchRoomsSemantic } from "@/modules/rooms/server";
import { RoomsCatalog } from "@/modules/rooms";
import type { Room } from "@/modules/rooms";

export const metadata = {
  title: "All Available Rooms | Ocean Haven Hotel",
  description:
    "Browse our 22 beautifully appointed rooms. Filter by room type, view, floor, price, or capacity to find your perfect stay in Da Nang, Vietnam.",
};

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const checkin = resolvedSearchParams.checkin as string | undefined;
  const checkout = resolvedSearchParams.checkout as string | undefined;
  const q = (resolvedSearchParams.q as string | undefined)?.trim();

  let rooms: Room[];
  let semanticSearchFailed = false;

  if (q) {
    try {
      rooms = await searchRoomsSemantic(q, checkin, checkout);
    } catch (err) {
      // e.g. Ollama not running: fall back to the normal list + keyword filter
      console.error("Semantic search failed:", err);
      semanticSearchFailed = true;
      rooms = await getRooms(checkin, checkout);
    }
  } else {
    rooms = await getRooms(checkin, checkout);
  }

  return (
    <RoomsCatalog
      key={q ?? ""}
      initialRooms={rooms}
      semanticQuery={q}
      semanticSearchFailed={semanticSearchFailed}
    />
  );
}
