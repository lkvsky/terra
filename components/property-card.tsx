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
      {/* Image — taller on mobile to give room for overlay */}
      <div className="relative h-40 w-full sm:h-24">
        {property.imageUrl && (
          <div className="absolute inset-x-0 bottom-0 top-[20px]">
            <Image
              src={property.imageUrl}
              alt={property.name}
              fill
              className="object-contain object-center"
              sizes="(max-width: 640px) 50vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Mobile overlay: title + button float over the image */}
        {onSelect && (
          <div className="absolute inset-x-0 bottom-0 sm:hidden bg-black/55 backdrop-blur-sm px-3 py-2">
            <p className="text-white font-semibold text-sm leading-tight truncate">
              {property.name}
            </p>
            <Button
              variant={selected ? "default" : "outline"}
              size="sm"
              className="mt-1.5 h-7 w-full text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(property);
              }}
            >
              {selected ? "Selected" : actionLabel}
            </Button>
          </div>
        )}
      </div>

      {/* Desktop layout — hidden on mobile */}
      <CardHeader className="hidden sm:block pb-2">
        <CardTitle className="text-lg">{property.name}</CardTitle>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {property.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="hidden sm:block">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {property.description}
        </p>
      </CardContent>
      {onSelect && (
        <CardFooter className="hidden sm:flex">
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
