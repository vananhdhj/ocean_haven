import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";
import { getUserBookings } from "@/modules/bookings/server";
import { CancelBookingButton } from "@/modules/bookings";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Calendar, CreditCard, Clock } from "lucide-react";
import { formatMoney, formatDate } from "@/shared/lib/utils";
import { Badge } from "@/shared/components/ui/badge";

const statusVariantMap: Record<string, "pending" | "confirmed" | "completed" | "cancelled"> = {
  Pending: "pending",
  Confirmed: "confirmed",
  Completed: "completed",
  Cancelled: "cancelled",
};

export const metadata = {
  title: "My Account — Ocean Haven Hotel",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, phone, role, created_at")
    .eq("id", user.id)
    .single();

  const bookings = await getUserBookings(user.id);
  // Same rule as dbo.sp_CancelMyBooking (UTC date): cancellable until the day before check-in
  const todayUtc = new Date().toISOString().slice(0, 10);
  const canCancel = (b: (typeof bookings)[number]) =>
    (b.status === "Pending" || b.status === "Confirmed") && b.check_in > todayUtc;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex-1 w-full">
      {/* Title */}
      <div className="mb-8">
        <h1
          className="text-3xl font-semibold italic text-slate-900"
          style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
        >
          My Account
        </h1>
        <p className="text-sm text-slate-500 font-sans">
          Manage your personal details and view your booking history
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="bookings" className="space-y-6 font-sans">
        <TabsList className="bg-slate-100 p-1 rounded-xl inline-flex">
          <TabsTrigger
            value="bookings"
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs cursor-pointer"
          >
            My Bookings ({bookings.length})
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs cursor-pointer"
          >
            Profile Details
          </TabsTrigger>
        </TabsList>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          {bookings.length > 0 ? (
            <div className="grid gap-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <h3
                        className="text-xl font-semibold italic text-slate-900"
                        style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
                      >
                        {booking.room}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Booking Code:{" "}
                        <span className="font-semibold text-[#3d64b0]">
                          {booking.booking_code}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariantMap[booking.status] || "default"}>
                        {booking.status}
                      </Badge>
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-slate-200">
                        Payment: {booking.payment_status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#3d64b0] flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Dates</p>
                        <p className="font-semibold text-slate-900">
                          {formatDate(booking.check_in)} –{" "}
                          {formatDate(booking.check_out)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#3d64b0] flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Total Price</p>
                        <p
                          className="font-bold text-slate-900"
                          style={{
                            fontFamily: "'Merriweather', 'DINPro', serif",
                          }}
                        >
                          {formatMoney(booking.total)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Booked On</p>
                        <p className="font-medium text-slate-700">
                          {formatDate(booking.bookedOn)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {canCancel(booking) && (
                    <div className="pt-3 border-t border-slate-100">
                      <CancelBookingButton bookingId={booking.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3
                className="text-xl font-semibold italic text-slate-900 mb-1"
                style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
              >
                No bookings yet
              </h3>
              <p className="text-sm text-slate-500 mb-5">
                You haven&apos;t made any reservations yet. Ready to experience Ocean
                Haven?
              </p>
              <Link
                href="/rooms"
                className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors inline-flex items-center shadow-xs cursor-pointer"
              >
                Browse Rooms
              </Link>
            </div>
          )}
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs max-w-2xl">
            <h3
              className="text-xl font-semibold italic text-slate-900 mb-4 pb-3 border-b border-slate-100"
              style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
            >
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Full Name
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {profile?.name || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Email Address
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {profile?.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Phone Number
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {profile?.phone || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Member Since
                </p>
                <p className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {profile?.created_at
                    ? formatDate(profile.created_at)
                    : "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
