"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

export function AdminBookingAction({ 
  bookingId, 
  currentStatus 
}: { 
  bookingId: string; 
  currentStatus: string;
}) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/update-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });
      
      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating} />}>
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleUpdateStatus("Confirmed")}
          disabled={currentStatus === "Confirmed" || currentStatus === "Cancelled"}
        >
          Mark as Confirmed
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleUpdateStatus("Completed")}
          disabled={currentStatus === "Completed" || currentStatus === "Cancelled"}
        >
          Mark as Completed
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleUpdateStatus("Cancelled")}
          disabled={currentStatus === "Cancelled" || currentStatus === "Completed"}
          className="text-red-600 focus:text-red-600"
        >
          Cancel Booking
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
