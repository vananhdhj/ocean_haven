import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminStats, getAdminBookings } from "@/lib/queries/bookings";
import { Users, Building2, Calendar, DollarSign, Search } from "lucide-react";
import { AdminBookingAction } from "@/components/admin/booking-action";
import { formatMoney, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const metadata = {
  title: "Admin Dashboard — Ocean Haven Hotel",
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams.search as string | undefined;
  const pageParam = resolvedSearchParams.page as string | undefined;
  const currentPage = parseInt(pageParam || "1", 10) || 1;
  const itemsPerPage = 10;

  const stats = await getAdminStats();
  const allBookings = await getAdminBookings(search);
  
  const totalPages = Math.ceil(allBookings.length / itemsPerPage);
  const bookings = allBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper to build URL with new page
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", pageNumber.toString());
    return `/admin?${params.toString()}`;
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex-1 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-semibold italic text-slate-900"
          style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
        >
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-500 font-sans">
          Manage bookings and monitor hotel performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 font-sans">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-1">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-1">
            <DollarSign className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Revenue
          </span>
          <span
            className="text-2xl font-extrabold text-slate-900"
            style={{ fontFamily: "'Merriweather', 'DINPro', serif" }}
          >
            {formatMoney(stats.total_revenue)}
          </span>
        </div>

        {/* Total Bookings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Bookings
          </span>
          <span
            className="text-2xl font-extrabold text-slate-900"
            style={{ fontFamily: "'Merriweather', 'DINPro', serif" }}
          >
            {stats.total_bookings}
          </span>
          <span className="text-[11px] text-slate-400">
            {stats.pending} pending, {stats.confirmed} confirmed
          </span>
        </div>

        {/* Total Rooms */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-1">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-1">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Rooms
          </span>
          <span
            className="text-2xl font-extrabold text-slate-900"
            style={{ fontFamily: "'Merriweather', 'DINPro', serif" }}
          >
            {stats.total_rooms}
          </span>
        </div>

        {/* Registered Users */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-1">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-1">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Registered Users
          </span>
          <span
            className="text-2xl font-extrabold text-slate-900"
            style={{ fontFamily: "'Merriweather', 'DINPro', serif" }}
          >
            {stats.total_users}
          </span>
        </div>
      </div>

      {/* Bookings Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden font-sans">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2
            className="text-xl font-semibold italic text-slate-900"
            style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
          >
            Recent Bookings
          </h2>
          <form className="flex items-center gap-2">
            <input
              type="text"
              name="search"
              placeholder="Search by phone number..."
              defaultValue={search}
              className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500 w-60"
            />
            <button
              type="submit"
              className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <th className="p-3.5 text-left">Booking Code</th>
                <th className="p-3.5 text-left">Guest Info</th>
                <th className="p-3.5 text-left">Room</th>
                <th className="p-3.5 text-left">Dates</th>
                <th className="p-3.5 text-left">Total</th>
                <th className="p-3.5 text-left">Status</th>
                <th className="p-3.5 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <tr
                    key={booking.booking_id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3.5 font-semibold text-[#3d64b0]">
                      {booking.booking_code}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">
                        {booking.guest_name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {booking.guest_phone}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-700">{booking.room_name}</td>
                    <td className="p-3.5 whitespace-nowrap text-slate-600">
                      {formatDate(booking.check_in)} –{" "}
                      {formatDate(booking.check_out)}
                    </td>
                    <td
                      className="p-3.5 font-bold text-slate-900"
                      style={{ fontFamily: "'Merriweather', 'DINPro', serif" }}
                    >
                      {formatMoney(booking.total_price)}
                    </td>
                    <td className="p-3.5">
                      <Badge variant={booking.status.toLowerCase() as any}>
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <AdminBookingAction
                        bookingId={booking.booking_id}
                        currentStatus={booking.status}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-400 font-sans"
                  >
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href={currentPage > 1 ? createPageUrl(currentPage - 1) : "#"}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i + 1}>
                    <PaginationLink 
                      href={createPageUrl(i + 1)}
                      isActive={currentPage === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    href={currentPage < totalPages ? createPageUrl(currentPage + 1) : "#"}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </main>
  );
}
