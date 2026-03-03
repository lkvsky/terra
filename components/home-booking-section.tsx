"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarDays, X } from "lucide-react";
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
    setCalendarOpen(false);
    setNotes("");
    setError(null);
  }

  function handleDateSelect(range: DateRange | undefined, triggerDate: Date) {
    // If a complete range is already selected, treat any new click as a fresh start
    if (dateRange?.from && dateRange?.to) {
      setDateRange({ from: triggerDate, to: undefined });
      return;
    }
    setDateRange(range);
    if (range?.from && range?.to) {
      setCalendarOpen(false);
    }
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

  const dateLabel = dateRange?.from ? (
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
  );

  return (
    <section id="properties" className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {properties.map((property) => (
          <div key={property.id} className="w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
            <PropertyCard
              property={property}
              selected={selectedPropertyId === property.id}
              onSelect={handleSelect}
              actionLabel="Book a Trip"
            />
          </div>
        ))}
      </div>

      {selectedPropertyId && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-muted/30 p-6 space-y-6">
          {/* Date range picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Dates</Label>

            {/* Desktop: Popover */}
            <Popover open={calendarOpen && !isMobile} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                  onClick={() => setCalendarOpen(true)}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {dateLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateSelect}
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
              placeholder="Any special requests, guest info, or notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full"
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 lg:flex-none"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 lg:flex-none" disabled={loading}>
              {loading ? "Submitting..." : isAdmin ? "Book" : "Request Trip"}
            </Button>
          </div>
        </form>
      )}

      {/* Mobile fullscreen calendar overlay */}
      {calendarOpen && isMobile && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-medium">Select dates</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCalendarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-1 items-start justify-center overflow-auto py-4">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from ?? new Date()}
              selected={dateRange}
              onSelect={handleDateSelect}
              numberOfMonths={1}
              disabled={{ before: new Date() }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
