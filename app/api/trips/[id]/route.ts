import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/calendar";
import type { TripStatus } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      property: true,
      users: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  // Users can only view trips they're part of (admins can view all)
  const isParticipant = trip.users.some((tu) => tu.userId === session.user.id);
  if (!isParticipant && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(trip);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, notes } = body as { status?: TripStatus; notes?: string };

  // Only admins can change status to APPROVED/REJECTED/ARCHIVED
  const adminStatuses: TripStatus[] = ["APPROVED", "REJECTED", "ARCHIVED"];
  if (status && adminStatuses.includes(status) && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  let calendarEventId = trip.calendarEventId;

  // On approval, create calendar event
  if (status === "APPROVED" && trip.status !== "APPROVED") {
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
      console.error("Failed to create calendar event:", err);
      // Don't block approval if calendar fails — log and continue
    }
  }

  const updated = await prisma.trip.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
      ...(calendarEventId && { calendarEventId }),
    },
    include: {
      property: true,
      users: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      users: { select: { userId: true } },
    },
  });

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const isParticipant = trip.users.some((tu) => tu.userId === session.user.id);
  if (!isParticipant && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete calendar event if one exists
  if (trip.calendarEventId) {
    try {
      await deleteCalendarEvent(trip.calendarEventId);
    } catch (err) {
      console.error("Failed to delete calendar event:", err);
      // Don't block deletion if calendar cleanup fails
    }
  }

  await prisma.trip.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
