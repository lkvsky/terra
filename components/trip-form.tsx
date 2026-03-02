"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { PROPERTIES } from "@/lib/properties";
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

export function TripForm() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProperty = PROPERTIES.find((p) => p.id === selectedPropertyId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedPropertyId) {
      setError("Please select a property.");
      return;
    }
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Property selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Select a Property</Label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROPERTIES.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              selected={selectedPropertyId === property.id}
              onSelect={(p) =>
                setSelectedPropertyId(
                  selectedPropertyId === p.id ? null : p.id
                )
              }
            />
          ))}
        </div>
      </div>

      {/* Date range picker */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Trip Dates</Label>
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
        <Label htmlFor="notes" className="text-base font-semibold">
          Notes <span className="text-sm font-normal text-muted-foreground">(optional)</span>
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

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Request Trip"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>

      {selectedProperty && (
        <div className="rounded-md border bg-muted/50 p-3 text-sm">
          <p className="font-medium">{selectedProperty.name}</p>
          <p className="text-muted-foreground">{selectedProperty.location}</p>
        </div>
      )}
    </form>
  );
}
