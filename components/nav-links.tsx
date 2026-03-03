"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, List, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinksProps {
  isAdmin: boolean;
  pendingCount: number;
}

function activeClass(pathname: string, href: string) {
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return cn(isActive && "bg-accent text-accent-foreground");
}

export function DesktopNav({ isAdmin, pendingCount }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 sm:flex">
      <Button variant="ghost" size="sm" asChild className={activeClass(pathname, "/")}>
        <Link href="/">
          <Home className="h-4 w-4" />
          Home
        </Link>
      </Button>
      <Button variant="ghost" size="sm" asChild className={activeClass(pathname, "/trips")}>
        <Link href="/trips">
          <List className="h-4 w-4" />
          My Trips
        </Link>
      </Button>
      {isAdmin && (
        <Button variant="ghost" size="sm" asChild className={activeClass(pathname, "/admin")}>
          <Link href="/admin" className="flex items-center gap-1.5">
            <Shield className="h-4 w-4" />
            Admin
            {pendingCount > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {pendingCount}
              </span>
            )}
          </Link>
        </Button>
      )}
    </nav>
  );
}

export function MobileNav({ isAdmin, pendingCount }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 border-t px-4 py-1 sm:hidden">
      <Button variant="ghost" size="sm" asChild className={activeClass(pathname, "/")}>
        <Link href="/">
          <Home className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="sm" asChild className={activeClass(pathname, "/trips")}>
        <Link href="/trips">
          <List className="h-4 w-4" />
        </Link>
      </Button>
      {isAdmin && (
        <Button variant="ghost" size="sm" asChild className={activeClass(pathname, "/admin")}>
          <Link href="/admin" className="relative flex items-center">
            <Shield className="h-4 w-4" />
            {pendingCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </Link>
        </Button>
      )}
    </nav>
  );
}
