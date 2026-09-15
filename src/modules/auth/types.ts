export type UserRole = "user" | "admin";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  role: string;
}

export interface AuthActionResult {
  success: boolean;
  message?: string;
}
