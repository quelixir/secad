"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignOutPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSignOut() {
    setLoading(true);
    setError(null);
    try {
      const result = await authClient.signOut();
      if (result?.error) {
        setError(result.error.message || "Failed to sign out");
      } else {
        router.push("/auth/signin");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="flex flex-col items-center gap-2">
          <LogOut className="h-8 w-8 text-primary" />
          <CardTitle>Sign Out</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-center text-muted-foreground">
            Are you sure you want to sign out?
          </p>
          <Button
            className="w-full"
            variant="destructive"
            onClick={handleSignOut}
            disabled={loading}
          >
            {loading ? "Signing Out..." : "Sign Out"}
          </Button>
          {error && (
            <div className="text-destructive text-sm text-center mt-2">
              {error}
            </div>
          )}
          <Link
            href="/auth/signin"
            className="text-primary hover:underline text-sm"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
