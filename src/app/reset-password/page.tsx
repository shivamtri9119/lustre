"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError("Passwords don't match.");
      return;
    }
    if (!token) {
      setFormError("This reset link is missing its token. Request a new one.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setFormError(body?.error ?? "Couldn't reset your password.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-line bg-ivory px-6 py-10 text-center">
        <CheckCircle2 className="h-7 w-7 text-gold-deep" />
        <p className="font-medium text-ink">Password updated</p>
        <p className="text-sm text-muted">You can now log in with your new password.</p>
        <Button variant="gold" size="lg" className="mt-2 w-full" onClick={() => router.push("/login")}>
          Go to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
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
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
        {submitting ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Set a new password" subtitle="Choose something you haven't used before.">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-ink hover:text-gold-deep">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}
