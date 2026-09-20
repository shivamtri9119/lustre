"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Check, Copy, ExternalLink, Link2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WhatsAppIcon } from "@/components/shared/icons";

// "Your booking page": the salon's own public link, ready to copy, open or
// send to customers on WhatsApp. The owner can rename the link.
export function BookingLinkCard() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [slug, setSlug] = React.useState<string | null>(null);
  const [origin, setOrigin] = React.useState("");
  const [loadError, setLoadError] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  React.useEffect(() => {
    // Stylists don't manage the booking page; the API would refuse them too.
    if (!role || role === "STYLIST" || role === "CUSTOMER") return;
    let cancelled = false;
    fetch("/api/salon/booking-link")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { slug: string }) => {
        if (!cancelled) setSlug(data.slug);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  if (!role || role === "STYLIST" || role === "CUSTOMER") return null;

  const url = slug && origin ? `${origin}/book/${slug}` : "";

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the link is still selectable in the box.
    }
  }

  async function save() {
    setSaveError(null);
    setSaving(true);
    const res = await fetch("/api/salon/booking-link", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: draft }),
    }).catch(() => null);
    setSaving(false);

    const body = await res?.json().catch(() => null);
    if (!res || !res.ok) {
      setSaveError(body?.error ?? "Couldn't save that link. Please try again.");
      return;
    }
    setSlug(body.slug);
    setEditing(false);
  }

  const whatsappHref = url
    ? `https://wa.me/?text=${encodeURIComponent(`Book your appointment online: ${url}`)}`
    : "#";

  return (
    <Card className="mb-6 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
          <Link2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-semibold text-ink">Your online booking page</h2>
          <p className="mt-0.5 text-sm text-muted">
            Share this link with your customers. They pick a service, stylist and time — only
            free slots are shown, and bookings land in your Appointments.
          </p>

          {loadError ? (
            <p className="mt-3 text-sm text-cancelled-fg">
              Couldn&apos;t load your link. Refresh the page to try again.
            </p>
          ) : !url ? (
            <p className="mt-3 text-sm text-muted">Getting your link…</p>
          ) : editing ? (
            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted">{origin}/book/</span>
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.toLowerCase())}
                  className="h-9 w-52"
                  maxLength={40}
                  autoFocus
                  aria-label="Booking link name"
                />
                <Button size="sm" variant="gold" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setSaveError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
              {saveError ? (
                <p className="mt-2 text-sm text-cancelled-fg">{saveError}</p>
              ) : (
                <p className="mt-2 text-xs text-muted-soft">
                  Lowercase letters, numbers and hyphens. Customers with your old link will need the new one.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Your booking link" />
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="gold" onClick={copy}>
                  {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy link"}
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink /> Open
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="h-4 w-4" /> Share on WhatsApp
                  </a>
                </Button>
                {role === "OWNER" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDraft(slug ?? "");
                      setEditing(true);
                    }}
                  >
                    <Pencil /> Customize link
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
