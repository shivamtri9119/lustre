"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CustomerProfileDialog } from "@/components/customers/customer-profile-dialog";
import { customers } from "@/lib/mock-data";
import { initials, formatCurrency } from "@/lib/utils";
import type { Customer } from "@/lib/types";

const tagVariant: Record<Customer["tags"][number], "gold" | "default" | "confirmed" | "cancelled"> = {
  VIP: "gold",
  New: "confirmed",
  Regular: "default",
  "At risk": "cancelled",
};

export function CustomerTable() {
  const [query, setQuery] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState<string>("all");
  const [selected, setSelected] = React.useState<Customer | null>(null);
  const [open, setOpen] = React.useState(false);

  const filtered = customers.filter((c) => {
    const matchesQuery =
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query);
    const matchesTag = tagFilter === "all" || c.tags.includes(tagFilter as Customer["tags"][number]);
    return matchesQuery && matchesTag;
  });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" />
          <Input
            placeholder="Search by name or phone..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All customers</SelectItem>
            <SelectItem value="VIP">VIP</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Regular">Regular</SelectItem>
            <SelectItem value="At risk">At risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Visits</TableHead>
              <TableHead>Total spend</TableHead>
              <TableHead>Last visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer"
                onClick={() => {
                  setSelected(c);
                  setOpen(true);
                }}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-ink">{c.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted">{c.phone}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {c.tags.map((tag) => (
                      <Badge key={tag} variant={tagVariant[tag]}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{c.totalVisits}</TableCell>
                <TableCell>{formatCurrency(c.totalSpend)}</TableCell>
                <TableCell className="text-muted">{c.lastVisit}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted">
                  No customers match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <CustomerProfileDialog customer={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}
