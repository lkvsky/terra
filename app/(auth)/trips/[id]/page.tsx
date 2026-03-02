import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Users, ArrowLeft, Calendar } from "lucide-react";
import type { TripStatus } from "@prisma/client";
import { CancelTripButton } from "@/components/cancel-trip-button";

const statusConfig: Record<
  TripStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
    description: string;
  }
> = {
  PENDING: {
    label: "Pending Review",
    variant: "warning",
    description: "Your request is waiting for admin approval.",
  },
  APPROVED: {
    label: "Approved",
    variant: "success",
    description: "Your trip has been approved. Check your calendar for the event.",
  },
  REJECTED: {
    label: "Rejected",
    variant: "destructive",
    description: "Your trip request was not approved.",
  },
  ARCHIVED: {
    label: "Archived",
    variant: "secondary",
    description: "This trip has been archived.",
  },
};

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

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

  if (!trip) notFound();

  // Authorization: only participants or admins
  const isParticipant = trip.users.some((tu) => tu.userId === session.user.id);
  const isAdmin = session.user.role === "ADMIN";
  if (!isParticipant && !isAdmin) notFound();
  const canCancel = isParticipant || isAdmin;

  const { label, variant, description } = statusConfig[trip.status];
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/trips">
            <ArrowLeft className="h-4 w-4" />
            Back to trips
          </Link>
        </Button>
        {canCancel && (
          <CancelTripButton
            tripId={trip.id}
            hasCalendarEvent={!!trip.calendarEventId}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-2xl">{trip.property.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {trip.property.location}
              </CardDescription>
            </div>
            <Badge variant={variant as Parameters<typeof Badge>[0]["variant"]}>{label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">{description}</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Check-in</p>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{format(startDate, "EEEE, MMMM d, yyyy")}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Check-out</p>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{format(endDate, "EEEE, MMMM d, yyyy")}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-4 w-4" /> Guests
            </p>
            <div className="flex flex-wrap gap-2">
              {trip.users.map((tu) => (
                <span
                  key={tu.userId}
                  className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm"
                >
                  {tu.user.name ?? tu.user.email}
                </span>
              ))}
            </div>
          </div>

          {trip.notes && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="text-sm">{trip.notes}</p>
            </div>
          )}

          {trip.calendarEventId && trip.status === "APPROVED" && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
              <Calendar className="h-4 w-4" />
              <span>Calendar event created (ID: {trip.calendarEventId})</span>
            </div>
          )}

          <div className="border-t pt-4 text-xs text-muted-foreground">
            Requested by {trip.createdBy.name ?? trip.createdBy.email} on{" "}
            {format(new Date(trip.createdAt), "MMMM d, yyyy")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
