import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PROPERTIES } from "@/lib/properties";
import { TripCard } from "@/components/trip-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, ArrowRight, MapPin } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const recentTrips = await prisma.trip.findMany({
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
    take: 3,
  });

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground">
            Browse properties and request a trip booking.
          </p>
        </div>
        <Button asChild>
          <Link href="/trips/new">
            <PlusCircle className="h-4 w-4" />
            New Trip Request
          </Link>
        </Button>
      </div>

      {/* Recent trips */}
      {recentTrips.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Recent Trips</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/trips">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {/* Properties */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Properties</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROPERTIES.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              {property.imageUrl && (
                <div className="relative h-48 w-full">
                  <Image
                    src={property.imageUrl}
                    alt={property.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{property.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {property.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {property.description}
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/trips/new">Book a Trip</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
