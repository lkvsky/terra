"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminTripRow } from "@/components/admin-trip-row";
import { Loader2, Shield } from "lucide-react";
import type { Property } from "@/lib/properties";
import type { TripStatus } from "@prisma/client";

interface TripUser {
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
}

interface AdminTrip {
  id: string;
  status: TripStatus;
  startDate: string;
  endDate: string;
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
}

interface AdminTripListProps {
  initialTrips: AdminTrip[];
  initialNextCursor: string | null;
  properties: Property[];
}

const STATUS_TABS: { label: string; value: TripStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

export function AdminTripList({
  initialTrips,
  initialNextCursor,
  properties,
}: AdminTripListProps) {
  const [trips, setTrips] = useState<AdminTrip[]>(initialTrips);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [selectedProperty, setSelectedProperty] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<TripStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchTrips = useCallback(
    async (cursor: string | null, append: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedStatus !== "ALL") params.set("status", selectedStatus);
        if (selectedProperty !== "ALL") params.set("propertyId", selectedProperty);
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/admin/trips?${params.toString()}`);
        if (!res.ok) return;

        const data: { trips: AdminTrip[]; nextCursor: string | null } =
          await res.json();

        setTrips((prev) => (append ? [...prev, ...data.trips] : data.trips));
        setNextCursor(data.nextCursor);
      } finally {
        setLoading(false);
      }
    },
    [selectedStatus, selectedProperty]
  );

  // Reset and refetch when filters change
  useEffect(() => {
    setTrips([]);
    setNextCursor(null);
    fetchTrips(null, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedProperty]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loading) {
          fetchTrips(nextCursor, true);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [nextCursor, loading, fetchTrips]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedStatus === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Property filter */}
        <select
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Trip list */}
      {trips.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Shield className="mb-4 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No trips found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <AdminTripRow
              key={trip.id}
              trip={trip}
              onStatusChange={(id, newStatus) =>
                setTrips((prev) =>
                  prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
                )
              }
            />
          ))}
        </div>
      )}

      {/* Sentinel + spinner */}
      <div ref={sentinelRef} className="h-4" />
      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
