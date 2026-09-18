"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const queryError = searchParams.get("error");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(
    queryError === "NoSalon"
      ? "That account isn't linked to a salon yet."
      : queryError
        ? "Couldn't sign you in — please try again."
        : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    // Was: unconditional router.push("/dashboard") on submit, no matter
    // what was typed. This actually verifies the password against the
    // stored bcrypt hash via src/auth.ts's Credentials provider.
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setSubmitting(false);

    if (!result || result.error) {
      setFormError("That email or password doesn't match an account.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to manage today's schedule.">
      <div className="space-y-4">
        <GoogleButton label="Continue with Google" callbackUrl={callbackUrl} />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-soft">OR</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@salon.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs font-medium text-gold-deep hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {formError && (
            <p className="rounded-md border border-cancelled-fg/30 bg-cancelled-bg px-3 py-2 text-sm text-cancelled-fg">
              {formError}
            </p>
          )}

          <Button type="submit" variant="gold" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          New to Lustre?{" "}
          <Link href="/signup" className="font-medium text-ink hover:text-gold-deep">
            Start your free trial
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  // useSearchParams() requires a Suspense boundary in the App Router.
  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  );
}
