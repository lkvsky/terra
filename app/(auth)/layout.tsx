import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { DesktopNav, MobileNav } from "@/components/nav-links";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  const pendingCount = isAdmin
    ? await prisma.trip.count({ where: { status: "PENDING" } })
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <DesktopNav isAdmin={isAdmin} pendingCount={pendingCount} />

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              )}
              <span className="text-sm text-muted-foreground">
                {session.user.name ?? session.user.email}
              </span>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>

        <MobileNav isAdmin={isAdmin} pendingCount={pendingCount} />
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
