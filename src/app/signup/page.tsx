"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SignupPage() {
  const router = useRouter();
  const [salonName, setSalonName] = React.useState("");
  const [ownerName, setOwnerName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    // This is the POST /api/auth/signup the old comment on this file
    // pointed at but never called — it creates a real Salon + an OWNER
    // User row (see that route for the exact transaction).
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salonName, ownerName, email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setFormError(body?.error ?? "Couldn't create your account.");
      setSubmitting(false);
      return;
    }

    // Account exists now — sign in immediately rather than sending them
    // back to the login form to re-type what they just typed.
    const result = await signIn("credentials", { email, password, redirect: false });
    setSubmitting(false);

    if (!result || result.error) {
      // Account was created but sign-in failed for some other reason
      // (e.g. a DB hiccup) — send them to log in manually instead of
      // stalling on this page.
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthLayout
      title="Start your free trial"
      subtitle="No card required. You're taking live bookings within the hour."
    >
      <div className="space-y-4">
        <GoogleButton label="Sign up with Google" />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-soft">OR</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="salon">Salon name</Label>
            <Input
              id="salon"
              placeholder="Aura Salon & Spa"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              placeholder="Tanvi Oberoi"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          {formError && (
            <p className="rounded-md border border-cancelled-fg/30 bg-cancelled-bg px-3 py-2 text-sm text-cancelled-fg">
              {formError}
            </p>
          )}

          <Button type="submit" variant="gold" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          Already on Lustre?{" "}
          <Link href="/login" className="font-medium text-ink hover:text-gold-deep">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
