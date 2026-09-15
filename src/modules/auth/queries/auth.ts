import { createClient } from "@/shared/lib/supabase/server";
import { SessionUser, UserProfile } from "../types";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("name, avatar, role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email!,
    name: profile?.name,
    avatar: profile?.avatar,
    role: profile?.role || "user",
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, avatar, role, phone, created_at")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}
