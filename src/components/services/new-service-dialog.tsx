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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { Service } from "@/lib/types";

const CATEGORIES = ["Hair", "Grooming", "Skin", "Makeup", "Nails", "Spa"];

export type ServiceInput = Omit<Service, "id">;

// Add-or-edit dialog for a service. `onSave` does the real request and
// returns an error message to show, or null on success (the dialog then
// closes). Pass `service` to edit, omit it to create.
export function ServiceDialog({
  trigger,
  service,
  staff,
  onSave,
}: {
  trigger: React.ReactNode;
  service?: Service;
  staff: { id: string; name: string }[];
  onSave: (input: ServiceInput) => Promise<string | null>;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("Hair");
  const [duration, setDuration] = React.useState("30");
  const [price, setPrice] = React.useState("500");
  const [assigned, setAssigned] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (next) {
      // Start from the service being edited, or a blank form for a new one.
      setName(service?.name ?? "");
      setCategory(service?.category ?? "Hair");
      setDuration(String(service?.durationMinutes ?? 30));
      setPrice(String(service?.price ?? 500));
      setAssigned(service?.assignedStaffIds ?? []);
      setError(null);
    }
    setOpen(next);
  }

  function toggleStaff(id: string) {
    setAssigned((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const problem = await onSave({
      name,
      category,
      durationMinutes: Number(duration),
      price: Number(price),
      assignedStaffIds: assigned,
    });
    setSaving(false);
    if (problem) {
      setError(problem);
      return;
    }
    setOpen(false);
  }

  const categories = CATEGORIES.includes(category) ? CATEGORIES : [...CATEGORIES, category];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? "Edit service" : "Add a service"}</DialogTitle>
          <DialogDescription>
            Customers can book a service online once at least one staff member is assigned to it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="svc-name">Service name</Label>
            <Input
              id="svc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-duration">Duration (min)</Label>
              <Input
                id="svc-duration"
                type="number"
                min={5}
                max={480}
                step={5}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-price">Price (₹)</Label>
              <Input
                id="svc-price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Who performs this service</Label>
            {staff.length === 0 ? (
              <p className="rounded-md border border-dashed border-line px-3 py-2 text-xs text-muted">
                You haven&apos;t added any staff yet. Add them on the Staff page first, then come
                back and assign them here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {staff.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleStaff(s.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      assigned.includes(s.id)
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" disabled={saving}>
              {saving ? "Saving…" : "Save service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
