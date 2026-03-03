import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PROPERTIES } from "@/lib/properties";
import { TripCard } from "@/components/trip-card";
import { Button } from "@/components/ui/button";
import { HomeBookingSection } from "@/components/home-booking-section";
import { ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  const isAdmin = session.user.role === "ADMIN";

  const upcomingTrips = await prisma.trip.findMany({
    where: {
      users: { some: { userId: session.user.id } },
      startDate: { gte: new Date() },
    },
    include: {
      property: true,
      users: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { startDate: "asc" },
    take: 3,
  });

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground">
          {`Browse properties and ${isAdmin ? 'book' : 'request'} a trip.`}
        </p>
      </div>

      {/* Upcoming trips */}
      {upcomingTrips.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upcoming Trips</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/trips">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {upcomingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      <HomeBookingSection properties={PROPERTIES} isAdmin={isAdmin} />
    </div>
  );
}
