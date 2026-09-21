"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StaffMember } from "@/lib/types";

export interface StaffInput {
  name: string;
  role: string;
  phone: string;
  email: string;
  workingHours: string;
  commissionRate: number;
  skills: string[];
  serviceIds: string[];
}

// Add-or-edit dialog for a staff member. It's mounted only while open (the
// page renders it conditionally), so its fields always start from the member
// being edited — or blank for a new one. `onSave` does the real request and
// returns an error message, or null on success.
export function StaffDialog({
  member,
  services,
  onSave,
  onClose,
}: {
  member?: StaffMember;
  services: { id: string; name: string }[];
  onSave: (input: StaffInput) => Promise<string | null>;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(member?.name ?? "");
  const [role, setRole] = React.useState(member?.role ?? "");
  const [phone, setPhone] = React.useState(member?.phone ?? "");
  const [email, setEmail] = React.useState(member?.email ?? "");
  const [workingHours, setWorkingHours] = React.useState(member?.workingHours ?? "10:00 AM – 7:00 PM");
  const [commission, setCommission] = React.useState(String(member?.commissionRate ?? 10));
  const [skills, setSkills] = React.useState((member?.skills ?? []).join(", "));
  const [serviceIds, setServiceIds] = React.useState<string[]>(member?.assignedServiceIds ?? []);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function toggleService(id: string) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const problem = await onSave({
      name,
      role,
      phone,
      email,
      workingHours,
      commissionRate: Number(commission),
      skills: skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      serviceIds,
    });
    setSaving(false);
    if (problem) {
      setError(problem);
      return;
    }
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? "Edit staff member" : "Add a staff member"}</DialogTitle>
          <DialogDescription>
            Tick the services this person performs — customers can only book them for those.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="st-name">Name</Label>
              <Input id="st-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-role">Role</Label>
              <Input
                id="st-role"
                placeholder="Senior Stylist"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                maxLength={60}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="st-phone">Phone (optional)</Label>
              <Input id="st-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-email">Email (optional)</Label>
              <Input id="st-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="st-hours">Working hours (for reference)</Label>
              <Input id="st-hours" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} maxLength={60} />
              <p className="text-xs text-muted-soft">
                Online booking currently offers 10 AM – 7 PM slots for everyone.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-commission">Commission (%)</Label>
              <Input
                id="st-commission"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-skills">Skills (optional, comma separated)</Label>
            <Input
              id="st-skills"
              placeholder="Colour, Cut, Styling"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Services they perform</Label>
            {services.length === 0 ? (
              <p className="rounded-md border border-dashed border-line px-3 py-2 text-xs text-muted">
                You haven&apos;t added any services yet. Add them on the Services page, then assign this
                person to them (from here or from the service).
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {services.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      serviceIds.includes(s.id)
                        ? "border-gold-deep bg-gold/15 text-gold-deep"
                        : "border-line text-muted hover:text-ink"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {error && (
            <p className="rounded-md border border-cancelled-fg/30 bg-cancelled-bg px-3 py-2 text-sm text-cancelled-fg">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" disabled={saving}>
              {saving ? "Saving…" : "Save staff member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
