"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, MapPin, Users, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import type { TripStatus } from "@prisma/client";

interface TripUser {
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
}

interface AdminTripRowProps {
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
    createdBy: {
      name?: string | null;
      email: string;
    };
  };
}

export function AdminTripRow({ trip }: AdminTripRowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const guestNames = trip.users.map((tu) => tu.user.name ?? tu.user.email);

  async function updateStatus(status: "APPROVED" | "REJECTED") {
    setLoading(status === "APPROVED" ? "approve" : "reject");
    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to update trip status");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="font-medium">{trip.property.name}</span>
          <Badge variant="warning">Pending</Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {trip.property.location}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {format(startDate, "MMM d")} &rarr; {format(endDate, "MMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {guestNames.join(", ")}
          </span>
        </div>
        {trip.notes && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Notes:</span> {trip.notes}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Requested by {trip.createdBy.name ?? trip.createdBy.email}
        </p>
      </div>

      <div className="flex gap-2 sm:flex-shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          disabled={loading !== null}
          onClick={() => updateStatus("REJECTED")}
        >
          <X className="h-4 w-4" />
          {loading === "reject" ? "Rejecting..." : "Reject"}
        </Button>
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700"
          disabled={loading !== null}
          onClick={() => updateStatus("APPROVED")}
        >
          <Check className="h-4 w-4" />
          {loading === "approve" ? "Approving..." : "Approve"}
        </Button>
      </div>
    </div>
  );
}
