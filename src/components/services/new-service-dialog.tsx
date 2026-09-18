"use client";

import * as React from "react";
import { Plus } from "lucide-react";
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
import { staff } from "@/lib/mock-data";
import type { Service } from "@/lib/types";

const CATEGORIES = ["Hair", "Grooming", "Skin", "Makeup", "Nails", "Spa"];

export function NewServiceDialog({
  onCreate,
}: {
  onCreate: (service: Omit<Service, "id">) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("Hair");
  const [duration, setDuration] = React.useState("30");
  const [price, setPrice] = React.useState("500");
  const [assigned, setAssigned] = React.useState<string[]>([]);

  function toggleStaff(id: string) {
    setAssigned((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate({
      name,
      category,
      durationMinutes: Number(duration),
      price: Number(price),
      assignedStaffIds: assigned,
    });
    setOpen(false);
    setName("");
    setDuration("30");
    setPrice("500");
    setAssigned([]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold">
          <Plus className="h-4 w-4" />
          Add service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a service</DialogTitle>
          <DialogDescription>This appears immediately in booking and invoicing.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="svc-name">Service name</Label>
            <Input id="svc-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
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
            <Label>Assigned staff</Label>
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold">
              Save service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
