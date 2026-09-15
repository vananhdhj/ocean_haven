import { notFound } from "next/navigation";
import { getRoomById } from "@/modules/rooms/server";
import { RoomDetail } from "@/modules/rooms";
import { createClient } from "@/shared/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const room = await getRoomById(resolvedParams.id);

  if (!room) {
    return { title: "Room Not Found | Ocean Haven Hotel" };
  }

  return {
    title: `${room.name} — Ocean Haven Hotel`,
    description: room.description,
  };
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const room = await getRoomById(resolvedParams.id);

  if (!room) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userData = null;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("name, phone")
      .eq("id", user.id)
      .single();

    userData = {
      id: user.id,
      email: user.email!,
      name: profile?.name,
      phone: profile?.phone,
    };
  }

  return <RoomDetail room={room} user={userData} />;
}
