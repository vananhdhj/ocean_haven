import Link from "next/link";
import Image from "next/image";
import { BedDouble, Eye, Sparkles, Star } from "lucide-react";
import type { Room } from "../types";
import { formatMoney } from "@/shared/lib/utils";

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  const formattedPrice = formatMoney(room.price);

  const getViewBadgeClass = (view: string) => {
    switch (view) {
      case "Sea View":
        return "bg-blue-50 text-blue-700";
      case "Garden View":
        return "bg-emerald-50 text-emerald-700";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-300 flex flex-col group cursor-pointer"
    >
      {/* Image & Badges */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-100">
        {room.image ? (
          <Image
            src={room.image}
            alt={room.name}
            fill
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 font-sans text-sm">
            No image available
          </div>
        )}

        {/* Top-left Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-purple-50 text-purple-700 font-sans shadow-xs">
            {room.type}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide font-sans shadow-xs ${getViewBadgeClass(
              room.view
            )}`}
          >
            {room.view}
          </span>
        </div>

        {/* Top-right Rating Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs rounded-full px-2 py-0.5 flex items-center gap-1 text-[11px] font-bold shadow-xs text-slate-900 font-sans z-10">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>{room.rating.toFixed(1)}</span>
        </div>

        {/* AI semantic search relevance */}
        {room.similarity !== undefined && (
          <div className="absolute bottom-3 left-3 bg-violet-600/90 text-white rounded-full px-2 py-0.5 inline-flex items-center gap-1 text-[11px] font-bold shadow-xs font-sans z-10">
            <Sparkles className="w-3 h-3" />
            <span>{Math.round(room.similarity * 100)}% match</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3
          className="text-2xl font-semibold italic text-slate-900 mb-2 leading-tight line-clamp-1"
          style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
          title={room.name}
        >
          {room.name}
        </h3>

        {/* Specs */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3 font-sans">
          <div className="flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {room.beds} {room.bedType}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>{room.view}</span>
          </div>
          <div>
            <span>Floor {room.floor}</span>
          </div>
        </div>

        {/* Rating Row */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 font-sans">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => {
              const isFilled = i <= Math.round(room.rating);
              return (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    isFilled
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-200 fill-slate-200"
                  }`}
                />
              );
            })}
          </div>
          <span className="font-bold text-slate-900 ml-0.5">
            {room.rating.toFixed(1)}
          </span>
          <span>({room.reviewCount} reviews)</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-200">
          <div className="flex items-baseline">
            <span
              className="text-xl font-bold text-slate-900 tracking-tight"
              style={{ fontFamily: "'Merriweather', 'DINPro', serif" }}
            >
              {formattedPrice}
            </span>
            <span className="text-xs text-slate-500 font-normal ml-1 font-sans">
              / night
            </span>
          </div>
          <span className="bg-[#0ea5e9] group-hover:bg-[#0284c7] text-white px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center font-sans shadow-xs">
            View Room
          </span>
        </div>
      </div>
    </Link>
  );
}
