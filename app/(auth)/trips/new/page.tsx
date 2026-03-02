import { TripForm } from "@/components/trip-form";

export default function NewTripPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Trip Request</h1>
        <p className="text-muted-foreground">
          Select a property and dates. Admins will review and approve your request.
        </p>
      </div>
      <TripForm />
    </div>
  );
}
