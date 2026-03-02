"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CancelTripButtonProps {
  tripId: string;
  hasCalendarEvent: boolean;
}

export function CancelTripButton({ tripId, hasCalendarEvent }: CancelTripButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    const message = hasCalendarEvent
      ? "Cancel this trip? The calendar event will also be removed. This cannot be undone."
      : "Cancel this trip? This cannot be undone.";

    if (!confirm(message)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to cancel trip.");
        return;
      }
      router.push("/trips");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleCancel} disabled={loading}>
      <Trash2 className="h-4 w-4" />
      {loading ? "Canceling..." : "Cancel Trip"}
    </Button>
  );
}
