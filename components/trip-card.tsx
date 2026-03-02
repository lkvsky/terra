import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, MapPin, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TripStatus } from "@prisma/client";

interface TripUser {
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
}

interface TripCardProps {
  trip: {
    id: string;
    status: TripStatus;
    startDate: Date | string;
    endDate: Date | string;
    notes?: string | null;
    property: {
      name: string;
      location: string;
    };
    users: TripUser[];
  };
}

const statusConfig: Record<
  TripStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
};

export function TripCard({ trip }: TripCardProps) {
  const { label, variant } = statusConfig[trip.status];
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const guestNames = trip.users.map((tu) => tu.user.name ?? tu.user.email);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{trip.property.name}</CardTitle>
          <Badge variant={variant as Parameters<typeof Badge>[0]["variant"]}>{label}</Badge>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {trip.property.location}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span>
            {format(startDate, "MMM d, yyyy")} &rarr;{" "}
            {format(endDate, "MMM d, yyyy")}
          </span>
        </div>
        {guestNames.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {guestNames.join(", ")}
            </span>
          </div>
        )}
        {trip.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {trip.notes}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/trips/${trip.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
