import { createClient } from "@/lib/supabase/server";
import type { Room, RoomRaw, FEATURED_ROOM_IDS } from "@/lib/types";

function transformRoom(raw: RoomRaw): Room {
  const primaryImage = raw.room_images?.find((img) => img.is_primary);
  const image = primaryImage?.image_url || raw.room_images?.[0]?.image_url || "";
  const images = raw.room_images?.map((img) => img.image_url) || [];
  const amenities =
    raw.room_amenities?.map((ra) => ra.amenities?.name).filter(Boolean) || [];

  return {
    id: raw.id,
    name: raw.name,
    type: raw.room_types?.name || "",
    floor: raw.floor,
    view: raw.view_types?.name || "",
    price: Number(raw.price),
    rating: Number(raw.rating),
    reviewCount: raw.review_count,
    maxGuests: raw.max_guests,
    beds: raw.bed_count,
    bedType: raw.bed_types?.name || "",
    size: Number(raw.size),
    image,
    images,
    description: raw.description,
    amenities,
    featured: false, // set later
  };
}

const FEATURED_IDS = [
  "room-001", "room-004", "room-007", "room-009", "room-010",
  "room-013", "room-016", "room-017", "room-019", "room-022",
];

export async function getRooms(checkin?: string, checkout?: string): Promise<Room[]> {
  const supabase = await createClient();

  // Cancel expired pending bookings
  await supabase
    .from("bookings")
    .update({ status: "Cancelled" })
    .eq("status", "Pending")
    .lt("hold_expires_at", new Date().toISOString());

  let query = supabase
    .from("rooms")
    .select(`
      *,
      room_types ( name ),
      view_types ( name ),
      bed_types ( name ),
      room_images ( image_url, is_primary ),
      room_amenities ( amenities ( name ) )
    `)
    .eq("is_active", true)
    .order("floor", { ascending: true })
    .order("name", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching rooms:", error);
    return [];
  }

  let rooms = (data as unknown as RoomRaw[]).map(transformRoom);

  // Filter by availability if dates provided
  if (checkin && checkout) {
    const { data: bookedRoomIds } = await supabase
      .from("bookings")
      .select("room_id")
      .not("status", "in", '("Cancelled","Completed")')
      .lt("check_in", checkout)
      .gt("check_out", checkin);

    const booked = new Set(bookedRoomIds?.map((b) => b.room_id) || []);
    rooms = rooms.filter((r) => !booked.has(r.id));
  }

  // Mark featured
  rooms.forEach((r) => {
    r.featured = FEATURED_IDS.includes(r.id);
  });

  return rooms;
}

export async function getRoomById(id: string): Promise<Room | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rooms")
    .select(`
      *,
      room_types ( name ),
      view_types ( name ),
      bed_types ( name ),
      room_images ( image_url, is_primary ),
      room_amenities ( amenities ( name ) )
    `)
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  const room = transformRoom(data as unknown as RoomRaw);
  room.featured = FEATURED_IDS.includes(room.id);
  return room;
}

export async function getFeaturedRooms(): Promise<Room[]> {
  const rooms = await getRooms();
  return rooms.filter((r) => r.featured);
}
