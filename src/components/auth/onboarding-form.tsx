"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingForm({ trialDays }: { trialDays: number }) {
  const { update } = useSession();
  const [salonName, setSalonName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salonName }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setFormError(body?.error ?? "Couldn't create your salon. Please try again.");
      setSubmitting(false);
      return;
    }

    // The session token was issued before the salon existed. update() makes
    // the server re-read the user (now OWNER, with a salon) into the token
    // so the dashboard opens without a second login.
    await update();
    // The session token was issued before the salon existed. update() makes
    // the server re-read the user (now OWNER, with a salon) into the token
    // so the dashboard opens without a second login.
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="salon">Salon name</Label>
        <Input
          id="salon"
          placeholder="Aura Salon & Spa"
          value={salonName}
          onChange={(e) => setSalonName(e.target.value)}
          minLength={2}
          maxLength={120}
          required
          autoFocus
        />
      </div>

      {formError && (
        <p className="rounded-md border border-cancelled-fg/30 bg-cancelled-bg px-3 py-2 text-sm text-cancelled-fg">
          {formError}
        </p>
      )}

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Setting up…" : `Start my ${trialDays}-day free trial`}
      </Button>
      <p className="text-center text-xs text-muted">
        No card required. Pricing starts after your trial ends.
      </p>
    </form>
  );
}
