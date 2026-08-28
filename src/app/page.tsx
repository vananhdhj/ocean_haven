import Link from "next/link";
import Image from "next/image";
import { ChevronsRight } from "lucide-react";
import { getFeaturedRooms } from "@/lib/queries/rooms";
import { RoomCard } from "@/components/room-card";

export const revalidate = 3600;

export default async function Home() {
  const featuredRooms = await getFeaturedRooms();

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden text-white px-6 py-16">
        <Image
          src="https://images.unsplash.com/photo-1664189767954-e4e605ae46da?w=1600&h=1000&fit=crop&auto=format"
          alt="Ocean Haven Hotel — patio with sea view"
          fill
          priority
          sizes="100vw"
          className="object-cover -z-10"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60 -z-10" />
        <div className="relative z-10 w-full max-w-4xl text-center">
          <h1
            className="text-4xl md:text-6xl font-semibold italic tracking-tight text-white drop-shadow-md"
            style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
          >
            Hotel Listing & Booking Website
          </h1>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-xs font-bold text-[#3d64b0] uppercase tracking-widest mb-1.5 font-sans">
                Curated for You
              </p>
              <h2
                className="text-3xl font-semibold italic text-slate-900"
                style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
              >
                Featured Rooms
              </h2>
            </div>
            <Link
              href="/rooms"
              className="inline-flex items-center gap-1 text-[#3d64b0] hover:text-[#0c266d] font-semibold text-sm hover:underline font-sans transition-colors"
            >
              <span>View all 22 rooms</span>
              <ChevronsRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Featured Rooms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
