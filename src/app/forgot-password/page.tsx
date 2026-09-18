"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // The response is always the same generic message regardless of
    // whether the account exists — see /api/auth/forgot-password for why.
    // So this form always shows the "check your inbox" state on submit;
    // there's deliberately nothing for the UI to branch on here.
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    setSubmitting(false);
    setSent(true);
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll send a secure link to your email."
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-line bg-ivory px-6 py-10 text-center">
          <MailCheck className="h-7 w-7 text-gold-deep" />
          <p className="font-medium text-ink">Check your inbox</p>
          <p className="text-sm text-muted">
            If an account exists for that email, a reset link is on its way.
          </p>
        </div>
      ) : (
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
          <Button type="submit" variant="gold" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-ink hover:text-gold-deep">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}
