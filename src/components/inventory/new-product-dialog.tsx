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
import type { InventoryItem } from "@/lib/types";

export function NewProductDialog({
  onCreate,
}: {
  onCreate: (item: Omit<InventoryItem, "id">) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [quantity, setQuantity] = React.useState("10");
  const [unit, setUnit] = React.useState("units");
  const [reorder, setReorder] = React.useState("5");
  const [supplier, setSupplier] = React.useState("");
  const [cost, setCost] = React.useState("100");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate({
      name,
      category,
      quantity: Number(quantity),
      unit,
      reorderLevel: Number(reorder),
      supplier,
      costPerUnit: Number(cost),
    });
    setOpen(false);
    setName("");
    setCategory("");
    setQuantity("10");
    setUnit("units");
    setReorder("5");
    setSupplier("");
    setCost("100");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold">
          <Plus className="h-4 w-4" />
          Add product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add inventory item</DialogTitle>
          <DialogDescription>Tracked for low-stock alerts and usage reports.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Product name</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-category">Category</Label>
              <Input id="p-category" value={category} onChange={(e) => setCategory(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-supplier">Supplier</Label>
              <Input id="p-supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-qty">Quantity</Label>
              <Input id="p-qty" type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-unit">Unit</Label>
              <Input id="p-unit" value={unit} onChange={(e) => setUnit(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-reorder">Reorder at</Label>
              <Input id="p-reorder" type="number" min={0} value={reorder} onChange={(e) => setReorder(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-cost">Cost per unit (₹)</Label>
            <Input id="p-cost" type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold">
              Save item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
