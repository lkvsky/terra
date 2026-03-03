import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCalendarEvent } from "@/lib/calendar";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trips = await prisma.trip.findMany({
    where: {
      users: {
        some: { userId: session.user.id },
      },
    },
    include: {
      property: true,
      users: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { propertyId, startDate, endDate, notes, guestUserIds } = body;

  if (!propertyId || !startDate || !endDate) {
    return NextResponse.json(
      { error: "propertyId, startDate, and endDate are required" },
      { status: 400 }
    );
  }

  // Validate property exists
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN";

  // Collect all user IDs (creator + guests), deduplicated
  const allUserIds = Array.from(
    new Set([session.user.id, ...(guestUserIds ?? [])])
  ) as string[];

  const trip = await prisma.trip.create({
    data: {
      propertyId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      notes: notes ?? null,
      status: isAdmin ? "APPROVED" : "PENDING",
      createdById: session.user.id,
      users: {
        create: allUserIds.map((userId) => ({ userId })),
      },
    },
    include: {
      property: true,
      users: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  // Auto-approved admin bookings get a calendar event immediately
  if (isAdmin) {
    try {
      const guestNames = trip.users
        .map((tu) => tu.user.name ?? tu.user.email)
        .filter(Boolean) as string[];

      const calendarEventId = await createCalendarEvent({
        tripId: trip.id,
        propertyName: trip.property.name,
        guestNames,
        startDate: trip.startDate,
        endDate: trip.endDate,
        notes: trip.notes,
      });

      await prisma.trip.update({
        where: { id: trip.id },
        data: { calendarEventId },
      });
    } catch (err) {
      console.error("Failed to create calendar event for admin booking:", err);
    }
  }

  return NextResponse.json(trip, { status: 201 });
}
