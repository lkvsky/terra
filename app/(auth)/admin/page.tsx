import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminTripRow } from "@/components/admin-trip-row";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) return null;

  const pendingTrips = await prisma.trip.findMany({
    where: { status: "PENDING" },
    include: {
      property: true,
      users: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">
            Review and approve pending trip requests.
          </p>
        </div>
      </div>

      {pendingTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Shield className="mb-4 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            No pending trip requests. Check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {pendingTrips.length} pending{" "}
            {pendingTrips.length === 1 ? "request" : "requests"}
          </p>
          <div className="space-y-3">
            {pendingTrips.map((trip) => (
              <AdminTripRow key={trip.id} trip={trip} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
