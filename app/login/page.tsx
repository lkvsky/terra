import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;

  if (session?.user) {
    redirect(callbackUrl ?? "/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-2 text-4xl">🏡</div>
          <CardTitle className="text-2xl">Terra</CardTitle>
          <CardDescription>
            Property trip booking for the Lucovsky family
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error === "AccessDenied"
                ? "Access denied. Only @lucovsky.com accounts are allowed."
                : "An error occurred. Please try again."}
            </div>
          )}
          <form
            action={async () => {
              "use server";
              await signIn("google", {
                redirectTo: callbackUrl ?? "/",
              });
            }}
          >
            <Button type="submit" className="w-full" size="lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="h-5 w-5"
              >
                <path
                  fill="#4285F4"
                  d="M47.5 24.5c0-1.6-.1-3.2-.4-4.8H24v9.1h13.1c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.4-10.6 7.4-17.5z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.5 0 12-2.1 16-5.8l-7.9-6c-2.2 1.5-5 2.4-8.1 2.4-6.2 0-11.5-4.2-13.4-9.9H2.5v6.2C6.5 42.7 14.7 48 24 48z"
                />
                <path
                  fill="#FBBC04"
                  d="M10.6 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7v-6.2H2.5C.9 16.4 0 20.1 0 24s.9 7.6 2.5 10.9l8.1-6.2z"
                />
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.9 2.4 30.5 0 24 0 14.7 0 6.5 5.3 2.5 13.1l8.1 6.2C12.5 13.7 17.8 9.5 24 9.5z"
                />
              </svg>
              Sign in with Google
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            Only @lucovsky.com accounts are permitted.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
