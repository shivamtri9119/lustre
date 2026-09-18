"use client";

import * as React from "react";
import { Boxes, AlertTriangle, IndianRupee, PackagePlus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { NewProductDialog } from "@/components/inventory/new-product-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { inventory as seedInventory } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import type { InventoryItem } from "@/lib/types";

export default function InventoryPage() {
  const [inventory, setInventory] = React.useState<InventoryItem[]>(seedInventory);

  function addItem(item: Omit<InventoryItem, "id">) {
    setInventory((prev) => [...prev, { ...item, id: `inv_item_${Date.now()}` }]);
  }

  function restock(id: string) {
    setInventory((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + i.reorderLevel } : i))
    );
  }

  const lowStock = inventory.filter((i) => i.quantity <= i.reorderLevel);
  const totalValue = inventory.reduce((sum, i) => sum + i.quantity * i.costPerUnit, 0);

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Catch low stock before it interrupts a service."
        actions={<NewProductDialog onCreate={addItem} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Tracked items" value={String(inventory.length)} icon={Boxes} />
        <StatCard label="Low stock alerts" value={String(lowStock.length)} icon={AlertTriangle} />
        <StatCard label="Inventory value" value={formatCurrency(totalValue)} icon={IndianRupee} />
      </div>

      {lowStock.length > 0 && (
        <Card className="mt-6 border-pending-fg/30 bg-pending-bg/40 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-pending-fg">
            <AlertTriangle className="h-4 w-4" />
            {lowStock.length} item{lowStock.length > 1 ? "s" : ""} at or below reorder level — restock soon.
          </p>
        </Card>
      )}

      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock level</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Cost / unit</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => {
              const low = item.quantity <= item.reorderLevel;
              const pct = Math.min(100, Math.round((item.quantity / (item.reorderLevel * 2)) * 100));
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-ink">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="w-48">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={pct}
                        className="flex-1"
                        indicatorClassName={low ? "bg-cancelled-fg" : undefined}
                      />
                      <span className="w-20 shrink-0 text-xs text-muted">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    {low && (
                      <Badge variant="cancelled" className="mt-1.5">
                        Reorder now
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted">{item.supplier}</TableCell>
                  <TableCell className="text-ink-soft">{formatCurrency(item.costPerUnit)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => restock(item.id)}>
                      <PackagePlus className="h-3.5 w-3.5" />
                      Restock
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
