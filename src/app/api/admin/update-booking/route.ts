import { NextRequest, NextResponse } from "next/server";
import { updateBookingStatusAction } from "@/modules/admin";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, status } = await req.json();

    if (!bookingId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await updateBookingStatusAction(bookingId, status);

    if (!result.success) {
      const statusCode = result.error === "Unauthorized" ? 401 : result.error === "Forbidden" ? 403 : 500;
      return NextResponse.json({ error: result.error }, { status: statusCode });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
