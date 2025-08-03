"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/lib/auth-context";
import { validateCallbackUrl } from "@/lib/utils";

function SignInForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, refreshSession } = useAuth();

  // Get the callback URL from search params
  const callbackUrl = searchParams?.get("callbackUrl");

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      const validatedCallbackUrl = validateCallbackUrl(callbackUrl);
      const redirectUrl = validatedCallbackUrl || "/entities";
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, callbackUrl]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const usernameOrEmail = (form.username as HTMLInputElement).value;
    const password = (form.password as HTMLInputElement).value;
    try {
      let result;
      if (usernameOrEmail.includes("@")) {
        result = await authClient.signIn.email({
          email: usernameOrEmail,
          password,
        });
      } else {
        // @ts-expect-error: username is supported by the Better Auth username plugin
        result = await authClient.signIn.username({
          username: usernameOrEmail,
          password,
        });
      }
      if (result.error) {
        setError(result.error.message || "Invalid credentials");
      } else {
        await refreshSession();
        // Redirect to callback URL or default to entities page
        const validatedCallbackUrl = validateCallbackUrl(callbackUrl);
        const redirectUrl = validatedCallbackUrl || "/entities";
        router.push(redirectUrl);
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
          <LogIn className="h-8 w-8 text-primary" />
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Username or Email</Label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
            {error && (
              <div className="text-destructive text-sm text-center mt-2">
                {error}
              </div>
            )}
          </form>
          <div className="mt-4 flex justify-between text-sm">
            <Link
              href="/auth/forgot"
              className="text-muted-foreground hover:underline"
            >
              Forgot password?
            </Link>
            <Link href="/auth/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}

export default SignInPage;
