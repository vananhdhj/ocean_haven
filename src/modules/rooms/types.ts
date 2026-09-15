export interface Room {
  id: string;
  name: string;
  type: string;
  floor: number;
  view: string;
  price: number;
  rating: number;
  reviewCount: number;
  maxGuests: number;
  beds: number;
  bedType: string;
  size: number;
  image: string;
  images: string[];
  description: string;
  amenities: string[];
  featured: boolean;
}

export interface RoomRaw {
  id: string;
  name: string;
  floor: number;
  rating: number;
  review_count: number;
  size: number;
  max_guests: number;
  bed_count: number;
  description: string;
  price: number;
  is_active: boolean;
  room_types: { name: string } | null;
  view_types: { name: string } | null;
  bed_types: { name: string } | null;
  room_images: { image_url: string; is_primary: boolean }[];
  room_amenities: { amenities: { name: string } }[];
}

export const FEATURED_ROOM_IDS = [
  "room-001",
  "room-004",
  "room-007",
  "room-009",
  "room-010",
  "room-013",
  "room-016",
  "room-017",
  "room-019",
  "room-022",
];
