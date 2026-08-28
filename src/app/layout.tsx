import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ocean Haven Hotel",
  description: "Boutique hotel with 22 beautifully appointed rooms across 3 floors, steps from the sea.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch user data for Navbar
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let userData = null;
  if (user) {
    // Get profile data for name, avatar, role
    const { data: profile } = await supabase
      .from("users")
      .select("name, avatar, role")
      .eq("id", user.id)
      .single();
      
    userData = {
      id: user.id,
      email: user.email!,
      name: profile?.name,
      avatar: profile?.avatar,
      role: profile?.role || "user",
    };
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Navbar user={userData} />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
