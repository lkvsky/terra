import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TripCard } from "@/components/trip-card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default async function TripsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const trips = await prisma.trip.findMany({
    where: {
      users: { some: { userId: session.user.id } },
    },
    include: {
      property: true,
      users: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Trips</h1>
          <p className="text-muted-foreground">
            All your trip requests and their status.
          </p>
        </div>
        <Button asChild>
          <Link href="/#properties">
            <PlusCircle className="h-4 w-4" />
            New Trip Request
          </Link>
        </Button>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="mb-4 text-muted-foreground">
            You haven&apos;t requested any trips yet.
          </p>
          <Button asChild>
            <Link href="/#properties">Request your first trip</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
