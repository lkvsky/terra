"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";
import type { Property } from "@/lib/properties";
import { PropertyCard } from "@/components/property-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface HomeBookingSectionProps {
  properties: Property[];
  isAdmin?: boolean;
}

export function HomeBookingSection({ properties, isAdmin }: HomeBookingSectionProps) {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelect(property: Property) {
    if (selectedPropertyId === property.id) {
      setSelectedPropertyId(null);
    } else {
      setSelectedPropertyId(property.id);
      setError(null);
    }
  }

  function handleCancel() {
    setSelectedPropertyId(null);
    setDateRange(undefined);
    setNotes("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!dateRange?.from || !dateRange?.to) {
      setError("Please select a date range.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create trip request.");
        return;
      }

      const trip = await res.json();
      router.push(`/trips/${trip.id}`);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="properties" className="space-y-4">
      <h2 className="text-xl font-semibold">Properties</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            selected={selectedPropertyId === property.id}
            onSelect={handleSelect}
            actionLabel="Book a Trip"
          />
        ))}
      </div>

      {selectedPropertyId && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-muted/30 p-6 space-y-6">
          <h3 className="text-base font-semibold">
            Book: {properties.find((p) => p.id === selectedPropertyId)?.name}
          </h3>

          {/* Date range picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Trip Dates</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal sm:w-72",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} &mdash;{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={{ before: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Any special requests, guest info, or notes for the admins…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="max-w-xl"
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : isAdmin ? "Book" : "Request Trip"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
