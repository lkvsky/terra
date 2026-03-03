import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { TripStatus } from "@prisma/client";

const VALID_STATUSES = new Set(["PENDING", "APPROVED", "REJECTED", "ARCHIVED"]);

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const propertyId = searchParams.get("propertyId") || undefined;
  const cursor = searchParams.get("cursor") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

  const status =
    statusParam && VALID_STATUSES.has(statusParam)
      ? (statusParam as TripStatus)
      : undefined;

  const trips = await prisma.trip.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(propertyId ? { propertyId } : {}),
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
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { startDate: "asc" },
  });

  let nextCursor: string | null = null;
  if (trips.length > limit) {
    const next = trips.pop();
    nextCursor = next!.id;
  }

  return NextResponse.json({ trips, nextCursor });
}
