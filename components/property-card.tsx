"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Property } from "@/lib/properties";

interface PropertyCardProps {
  property: Property;
  selected?: boolean;
  onSelect?: (property: Property) => void;
  actionLabel?: string;
}

export function PropertyCard({
  property,
  selected,
  onSelect,
  actionLabel = "Select",
}: PropertyCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        selected && "ring-2 ring-primary",
        onSelect && "cursor-pointer hover:shadow-md"
      )}
      onClick={() => onSelect?.(property)}
    >
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
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {property.description}
        </p>
      </CardContent>
      {onSelect && (
        <CardFooter>
          <Button
            variant={selected ? "default" : "outline"}
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(property);
            }}
          >
            {selected ? "Selected" : actionLabel}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
