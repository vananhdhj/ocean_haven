"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "../actions/bookings";
import type { Room } from "@/modules/rooms/types";
import { formatMoney } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { BookingActionResult } from "../types";

interface BookingFormProps {
  room: Room;
  user: {
    id: string;
    email: string;
    name?: string | null;
    phone?: string | null;
  } | null;
}

const initialState: BookingActionResult = {
  success: false,
  message: "",
  bookingId: "",
  bookingCode: "",
  totalPrice: 0,
  paymentMethod: "",
};

export function BookingForm({ room, user }: BookingFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<BookingActionResult, FormData>(
    createBooking,
    initialState
  );
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [nights, setNights] = useState(0);

  // Calculate nights when dates change
  const handleDateChange = (type: "in" | "out", value: string) => {
    if (type === "in") setCheckIn(value);
    if (type === "out") setCheckOut(value);

    const ci = type === "in" ? value : checkIn;
    const co = type === "out" ? value : checkOut;

    if (ci && co) {
      const diff = new Date(co).getTime() - new Date(ci).getTime();
      const n = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setNights(n > 0 ? n : 0);
    } else {
      setNights(0);
    }
  };

  const totalPrice = nights > 0 ? nights * room.price : 0;
  
  const formattedPrice = formatMoney(totalPrice);
  const formattedRoomPrice = formatMoney(room.price);

  // Redirect to VNPay or success page when booking is successful
  if (state.success && state.bookingId) {
    if (state.paymentMethod === "vnpay") {
      router.push(`/api/payments/create-vnpay?bookingCode=${state.bookingCode}&amount=${state.totalPrice}`);
    } else {
      router.push(`/profile?success=1&booking=${state.bookingCode}`);
    }
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p>Redirecting to payment...</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Book this room</CardTitle>
          <CardDescription>
            {formattedRoomPrice} / night
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 p-6 rounded-lg text-center border border-dashed">
            <h3 className="font-medium mb-2">Login Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please sign in to book a room at Ocean Haven.
            </p>
            <Button onClick={() => router.push(`?login=1`)} className="w-full">
              Sign In to Book
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book this room</CardTitle>
        <CardDescription>
          {formattedRoomPrice} / night
        </CardDescription>
      </CardHeader>
      
      <form action={formAction}>
        <input type="hidden" name="roomId" value={room.id} />
        
        <CardContent className="space-y-4">
          {state.message && !state.success && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {state.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkIn">Check-in</Label>
              <Input
                id="checkIn"
                name="checkIn"
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={checkIn}
                onChange={(e) => handleDateChange("in", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOut">Check-out</Label>
              <Input
                id="checkOut"
                name="checkOut"
                type="date"
                required
                min={checkIn || new Date().toISOString().split("T")[0]}
                value={checkOut}
                onChange={(e) => handleDateChange("out", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guests">Guests</Label>
            <Select name="guests" defaultValue="2" required>
              <SelectTrigger>
                <SelectValue placeholder="Select guests" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: room.maxGuests }).map((_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {i + 1} {i === 0 ? "Guest" : "Guests"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" defaultValue={user.name || ""} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={user.email} required readOnly className="bg-slate-50 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={user.phone || ""} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
            <Textarea id="specialRequests" name="specialRequests" placeholder="Any special needs?" rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select name="paymentMethod" defaultValue="vnpay" required>
              <SelectTrigger>
                <SelectValue placeholder="Select payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vnpay">Pay via VNPay (Online)</SelectItem>
                <SelectItem value="cod">Pay at Hotel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {nights > 0 && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Total for {nights} {nights === 1 ? 'night' : 'nights'}</p>
              </div>
              <div className="text-xl font-bold text-primary">
                {formattedPrice}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isPending || nights <= 0}
          >
            {isPending ? "Processing..." : "Confirm Booking"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
