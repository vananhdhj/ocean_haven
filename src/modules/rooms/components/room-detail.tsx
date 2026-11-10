"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/shared/lib/utils";
import { Room } from "../types";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Camera,
  Star,
  Building2,
  User,
  BedDouble,
  Eye,
  Shield,
  CheckCircle,
  Clock,
  Wifi,
  Sparkles,
  Tv,
  Coffee,
  Utensils,
  Bath,
  Leaf,
  BookOpen,
  Car,
  Waves,
  Heart,
  Dumbbell,
  X,
} from "lucide-react";
import { createBooking } from "@/modules/bookings/actions/bookings";
import { useRouter } from "next/navigation";

interface RoomDetailProps {
  room: Room;
  user: {
    id: string;
    email: string;
    name?: string | null;
    phone?: string | null;
  } | null;
}

const AMENITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Free WiFi": Wifi,
  "Air Conditioning": Sparkles,
  "Flat-screen TV": Tv,
  "4K Smart TV": Tv,
  "Smart TV": Tv,
  "Mini Bar": Coffee,
  "Room Service": Utensils,
  "Sea View": Eye,
  "En-suite Bathroom": Bath,
  "Coffee Maker": Coffee,
  "Garden View": Leaf,
  "Work Desk": BookOpen,
  "Car": Car,
  "Balcony": Waves,
  "Rainfall Shower": Waves,
  "Rain Shower": Waves,
  "Freestanding Bathtub": Bath,
  "City View": Building2,
  "Jacuzzi": Sparkles,
  "Full Kitchen": Utensils,
  "Kitchenette": Utensils,
  "Butler Service": Shield,
  "24h Room Service": Clock,
  "Children's Area": Heart,
  "Espresso Machine": Coffee,
  "Dumbbell": Dumbbell,
  "Laundry": Sparkles,
};

export function RoomDetail({ room, user }: RoomDetailProps) {
  const router = useRouter();
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fmtVND = (n: number) => formatMoney(n);

  const images = room.images && room.images.length > 0 ? room.images : [room.image];
  const hasMultipleImages = images.length > 1;

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

  const nights =
    checkIn && checkOut
      ? Math.max(
        0,
        Math.ceil(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
        )
      )
      : 0;

  const totalPrice = nights > 0 ? nights * room.price : room.price;

  const handlePrevImg = () => {
    setActiveImgIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImg = () => {
    setActiveImgIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("?login=1");
      return;
    }

    if (!checkIn || !checkOut) {
      setErrorMessage("Please select both check-in and check-out dates.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("roomId", room.id);
    formData.append("checkIn", checkIn);
    formData.append("checkOut", checkOut);
    formData.append("guests", guests);
    formData.append("name", name);
    formData.append("email", user.email);
    formData.append("phone", phone);
    formData.append("specialRequests", specialRequests);

    try {
      const res = await createBooking(null, formData);
      if (res.success && res.bookingId) {
        router.push(`/profile?booking=${res.bookingCode}`);
      } else {
        setErrorMessage(res.message || "Failed to create booking.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="py-8 md:py-12 flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/rooms"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold text-sm transition-colors font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to rooms</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Gallery */}
            <div>
              <div className="relative h-80 md:h-[420px] rounded-3xl overflow-hidden bg-slate-100 shadow-xs">
                <Image
                  src={images[activeImgIdx]}
                  alt={`${room.name} — photo ${activeImgIdx + 1}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />

                {hasMultipleImages && (
                  <>
                    <button
                      type="button"
                      className="absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-slate-800 transition-colors z-10 cursor-pointer"
                      onClick={handlePrevImg}
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      className="absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-slate-800 transition-colors z-10 cursor-pointer"
                      onClick={handleNextImg}
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1.5 z-10 font-sans">
                  <Camera className="w-3.5 h-3.5" />
                  <span>
                    {activeImgIdx + 1}/{images.length}
                  </span>
                </div>
              </div>

              {hasMultipleImages && (
                <div className="flex gap-2 overflow-x-auto pt-3 pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`w-20 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer relative shrink-0 ${activeImgIdx === idx
                          ? "border-[#3d64b0] opacity-100 shadow-xs"
                          : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      onClick={() => setActiveImgIdx(idx)}
                    >
                      <Image
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title Section */}
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
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
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-slate-100 text-slate-700 font-sans shadow-xs">
                  Floor {room.floor}
                </span>
              </div>

              <h1
                className="text-3xl md:text-4xl font-semibold italic text-slate-900 my-2"
                style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
              >
                {room.name}
              </h1>

              <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 font-sans">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => {
                    const isFilled = i <= Math.round(room.rating);
                    return (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${isFilled
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200 fill-slate-200"
                          }`}
                      />
                    );
                  })}
                </div>
                <span className="font-bold text-slate-900 ml-1">
                  {room.rating.toFixed(1)}
                </span>
                <span>({room.reviewCount} reviews)</span>
              </div>
            </div>

            {/* 4 Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2 font-sans">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-xs">
                <Building2 className="w-5 h-5 text-[#3d64b0] mx-auto mb-1.5" />
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                  Room Size
                </p>
                <p className="text-sm font-bold text-slate-900">{room.size} m²</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-xs">
                <User className="w-5 h-5 text-[#3d64b0] mx-auto mb-1.5" />
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                  Max Guests
                </p>
                <p className="text-sm font-bold text-slate-900">{room.maxGuests} guests</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-xs">
                <BedDouble className="w-5 h-5 text-[#3d64b0] mx-auto mb-1.5" />
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                  Bed Type
                </p>
                <p className="text-sm font-bold text-slate-900">{room.bedType}</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-xs">
                <Eye className="w-5 h-5 text-[#3d64b0] mx-auto mb-1.5" />
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                  View
                </p>
                <p className="text-sm font-bold text-slate-900">{room.view}</p>
              </div>
            </div>

            {/* Description */}
            <div className="my-2">
              <h2
                className="text-2xl font-semibold italic text-slate-900 mb-2.5"
                style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
              >
                About This Room
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base font-sans">
                {room.description}
              </p>
            </div>

            {/* Amenities Grid */}
            <div className="my-2">
              <h2
                className="text-2xl font-semibold italic text-slate-900 mb-3"
                style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
              >
                Amenities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-sans">
                {room.amenities.map((a) => {
                  const IconComp = AMENITY_ICONS[a] || Sparkles;
                  return (
                    <div
                      key={a}
                      className="flex items-center gap-3 bg-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800"
                    >
                      <IconComp className="w-4 h-4 text-[#3d64b0]" />
                      <span>{a}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div>
            <div className="sticky top-24 bg-white border border-slate-200 rounded-3xl shadow-md p-6 font-sans">
              <div className="flex items-baseline justify-between mb-2">
                <span
                  className="text-3xl font-bold text-slate-900 tracking-tight"
                  style={{ fontFamily: "'Merriweather', 'DINPro', serif" }}
                >
                  {fmtVND(room.price)}
                </span>
                <span className="text-sm text-slate-500">/ night</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>
                  {room.rating.toFixed(1)} · {room.reviewCount} reviews
                </span>
              </div>

              <div className="bg-slate-100 rounded-2xl p-4 mb-5 space-y-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Room Type
                  </p>
                  <p className="text-sm font-semibold text-slate-900">{room.type}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Floor
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      Floor {room.floor}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Max Guests
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      Up to {room.maxGuests}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-3.5 rounded-xl font-bold text-sm shadow-sm transition-colors text-center cursor-pointer mb-5"
                onClick={() => {
                  if (!user) {
                    router.push("?login=1");
                  } else {
                    setBookingModalOpen(true);
                  }
                }}
              >
                Book Now — {fmtVND(room.price)}/night
              </button>

              <div className="space-y-2.5 text-xs text-slate-500 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Free cancellation up to 48h before check-in</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Instant confirmation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#0ea5e9] shrink-0" />
                  <span>Check-in 14:00 · Check-out 12:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setBookingModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2
                className="text-xl font-semibold italic text-slate-900"
                style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
              >
                Book {room.name}
              </h2>
              <button
                type="button"
                onClick={() => setBookingModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {errorMessage}
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={checkIn || new Date().toISOString().split("T")[0]}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Number of Guests
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
                >
                  {Array.from({ length: room.maxGuests }).map((_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      {i + 1} {i === 0 ? "Guest" : "Guests"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Special Requests (Optional)
                </label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                  placeholder="Any special accommodations or arrival time info?"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Payment Method
                </label>
                <p className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800">
                  Pay at the hotel on check-in
                </p>
              </div>

              {/* Price Summary */}
              {nights > 0 && (
                <div className="bg-slate-100 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Total ({nights} {nights === 1 ? "night" : "nights"})
                    </p>
                    <p className="text-xs text-slate-500">
                      {fmtVND(room.price)} x {nights} nights
                    </p>
                  </div>
                  <span
                    className="text-lg font-bold text-[#3d64b0]"
                    style={{ fontFamily: "'Merriweather', 'DINPro', serif" }}
                  >
                    {fmtVND(totalPrice)}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || nights <= 0}
                className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-3 rounded-xl font-bold text-sm shadow-sm transition-colors text-center cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Confirm & Proceed"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
