import { connection } from "next/server";
import { execProc } from "@/shared/lib/db/sqlserver";
import { Room, RoomRaw, FEATURED_ROOM_IDS } from "../types";

function transformRoom(raw: RoomRaw): Room {
  const primaryImage = raw.images?.find((img) => img.is_primary);
  const image = primaryImage?.image_url || raw.images?.[0]?.image_url || "";
  const images = raw.images?.map((img) => img.image_url) || [];
  const amenities = raw.amenities?.map((a) => a.name) || [];

  return {
    id: raw.id,
    name: raw.name,
    type: raw.room_type || "",
    floor: raw.floor,
    view: raw.view_type || "",
    price: Number(raw.price),
    rating: Number(raw.rating),
    reviewCount: raw.review_count,
    maxGuests: raw.max_guests,
    beds: raw.bed_count,
    bedType: raw.bed_type || "",
    size: Number(raw.size),
    image,
    images,
    description: raw.description,
    amenities,
    featured: false,
  };
}

async function fetchRooms(params: {
  RoomId?: string;
  CheckIn?: string;
  CheckOut?: string;
}): Promise<Room[]> {
  const [rows] = await execProc<{ rooms_json: string | null }>("dbo.sp_GetRooms", params);
  const raw: RoomRaw[] = JSON.parse(rows?.[0]?.rooms_json ?? "[]");
  return raw.map((r) => {
    const room = transformRoom(r);
    room.featured = FEATURED_ROOM_IDS.includes(room.id);
    return room;
  });
}

export async function getRooms(checkin?: string, checkout?: string): Promise<Room[]> {
  // Availability is live data: render at request time, never prerender at build.
  // (Outside try/catch: Next.js signals this with an error that must not be caught.)
  await connection();

  try {
    // sp_GetRooms also filters out rooms booked for the dates, if given
    return await fetchRooms({ CheckIn: checkin, CheckOut: checkout });
  } catch (err) {
    console.error("Error fetching rooms:", err);
    return [];
  }
}

export async function getRoomById(id: string): Promise<Room | null> {
  await connection();
  try {
    const [room] = await fetchRooms({ RoomId: id });
    return room ?? null;
  } catch (err) {
    console.error("Error fetching room:", err);
    return null;
  }
}

export async function getFeaturedRooms(): Promise<Room[]> {
  const rooms = await getRooms();
  return rooms.filter((r) => r.featured);
}
