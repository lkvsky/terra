import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyActionToken } from "@/lib/trip-tokens";
import { createCalendarEvent } from "@/lib/calendar";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const token = req.nextUrl.searchParams.get("token");
  const action = req.nextUrl.searchParams.get("action");

  if (!token || !action) {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  const verified = verifyActionToken(token);
  if (!verified) {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  if (verified.tripId !== id || verified.action !== action) {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      property: true,
      users: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!trip) {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  // Already reviewed — idempotent redirect
  if (trip.status !== "PENDING") {
    return NextResponse.redirect(new URL(`/trips/${id}`, baseUrl));
  }

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED";
  let calendarEventId = trip.calendarEventId;

  if (newStatus === "APPROVED") {
    try {
      const guestNames = trip.users
        .map((tu) => tu.user.name ?? tu.user.email)
        .filter(Boolean) as string[];

      calendarEventId = await createCalendarEvent({
        tripId: trip.id,
        propertyName: trip.property.name,
        guestNames,
        startDate: trip.startDate,
        endDate: trip.endDate,
        notes: trip.notes,
      });
    } catch (err) {
      console.error("Failed to create calendar event via review link:", err);
      // Non-blocking — continue with approval
    }
  }

  await prisma.trip.update({
    where: { id },
    data: {
      status: newStatus,
      ...(calendarEventId && { calendarEventId }),
    },
  });

  return NextResponse.redirect(new URL(`/trips/${id}`, baseUrl));
}
