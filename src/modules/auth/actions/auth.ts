"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { AuthActionResult } from "../types";

export async function login(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, message: "Please enter both email and password." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      message: error.message || "Invalid email or password. Please try again.",
    };
  }

  revalidatePath("/", "layout");
  return { success: true, message: "Login successful." };
}

export async function register(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!name || !email || !phone || !password) {
    return { success: false, message: "All fields are required." };
  }

  if (password.length < 6) {
    return { success: false, message: "Password must be at least 6 characters." };
  }

  if (password !== confirm) {
    return { success: false, message: "Passwords do not match." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Display fields only: the signup trigger always creates a 'user'
      data: { name, phone },
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true, message: "Registration successful." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return { success: true, message: "Logged out successfully." };
}
