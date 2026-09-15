import { getRooms } from "@/modules/rooms/server";
import { RoomsCatalog } from "@/modules/rooms";

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

  const rooms = await getRooms(checkin, checkout);

  return <RoomsCatalog initialRooms={rooms} />;
}
