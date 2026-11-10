"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { cancelMyBooking } from "../actions/bookings";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    setError("");
    startTransition(async () => {
      const res = await cancelMyBooking(bookingId);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.message || "Failed to cancel booking.");
        setConfirming(false);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {error && <p className="text-xs text-red-600 mr-auto">{error}</p>}
      {confirming ? (
        <>
          <span className="text-xs text-slate-500">Cancel this booking?</span>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={isPending}>
            Keep booking
          </Button>
          <Button variant="destructive" size="sm" onClick={handleCancel} disabled={isPending}>
            {isPending ? "Cancelling..." : "Yes, cancel"}
          </Button>
        </>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
          Cancel booking
        </Button>
      )}
    </div>
  );
}
