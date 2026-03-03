import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminTripList } from "@/components/admin-trip-list";
import { PROPERTIES } from "@/lib/properties";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) return null;

  const LIMIT = 20;

  const rawTrips = await prisma.trip.findMany({
    include: {
      property: true,
      users: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    take: LIMIT + 1,
    orderBy: { startDate: "asc" },
  });

  let initialNextCursor: string | null = null;
  if (rawTrips.length > LIMIT) {
    const next = rawTrips.pop();
    initialNextCursor = next!.id;
  }

  // Serialize dates to strings for client component
  const initialTrips = rawTrips.map((trip) => ({
    ...trip,
    startDate: trip.startDate.toISOString(),
    endDate: trip.endDate.toISOString(),
    createdAt: trip.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">All trips across all statuses.</p>
        </div>
      </div>

      <AdminTripList
        initialTrips={initialTrips}
        initialNextCursor={initialNextCursor}
        properties={PROPERTIES}
      />
    </div>
  );
}
