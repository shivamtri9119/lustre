"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

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
    //
    // DIAGNOSTIC BUILD: update() has been observed to hang indefinitely in
    // production with no console error and no visibly failed network
    // request. Racing it against a hard timeout guarantees the user is
    // never stuck on this screen again, and the console.log calls tell us
    // definitively whether update() resolved, rejected, or timed out.
    console.log("[onboarding] POST /api/onboarding succeeded, calling update()");

    try {
      await withTimeout(update(), 8000);
      console.log("[onboarding] update() resolved successfully");
    } catch (err) {
      console.error("[onboarding] update() failed or timed out:", err);
    }

    console.log("[onboarding] navigating to /dashboard now");
    window.location.href = "/dashboard";
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
