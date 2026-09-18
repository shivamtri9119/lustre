"use client";

import * as React from "react";
import { Mail, MailCheck, ReceiptText, Wallet, Clock3, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { NewInvoiceDialog } from "@/components/billing/new-invoice-dialog";
import { InvoicePreviewDialog } from "@/components/billing/invoice-preview-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { invoices as seedInvoices } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import type { Invoice, PaymentStatus } from "@/lib/types";

const statusVariant: Record<PaymentStatus, "completed" | "pending" | "confirmed"> = {
  PAID: "completed",
  PENDING: "pending",
  PARTIAL: "confirmed",
};

export default function BillingPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>(seedInvoices);
  const [selected, setSelected] = React.useState<Invoice | null>(null);
  const [open, setOpen] = React.useState(false);

  function addInvoice(invoice: Omit<Invoice, "id" | "invoiceNumber">) {
    const number = `AUR-2026-${String(143 + invoices.length).padStart(4, "0")}`;
    setInvoices((prev) => [
      { ...invoice, id: `inv_${Date.now()}`, invoiceNumber: number },
      ...prev,
    ]);
  }

  const totalRevenue = invoices.reduce((sum, i) => sum + i.total, 0);
  const paid = invoices.filter((i) => i.paymentStatus === "PAID").length;
  const pending = invoices.filter((i) => i.paymentStatus === "PENDING").length;
  const partial = invoices.filter((i) => i.paymentStatus === "PARTIAL").length;

  return (
    <div>
      <PageHeader
        title="Billing & Invoices"
        description="Generated, saved, and emailed automatically the moment payment is marked complete."
        actions={<NewInvoiceDialog onCreate={addInvoice} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total invoiced" value={formatCurrency(totalRevenue)} icon={ReceiptText} />
        <StatCard label="Paid invoices" value={String(paid)} icon={Wallet} />
        <StatCard label="Pending payment" value={String(pending)} icon={Clock3} />
        <StatCard label="Partial payment" value={String(partial)} icon={AlertCircle} />
      </div>

      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium text-ink">{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.customerName}</TableCell>
                <TableCell className="text-muted">{inv.date}</TableCell>
                <TableCell className="font-medium text-ink-soft">{formatCurrency(inv.total)}</TableCell>
                <TableCell className="text-muted">{inv.paymentMethod.replace("_", " ")}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[inv.paymentStatus]}>{inv.paymentStatus.toLowerCase()}</Badge>
                </TableCell>
                <TableCell>
                  {inv.emailSent ? (
                    <MailCheck className="h-4 w-4 text-completed-fg" />
                  ) : (
                    <Mail className="h-4 w-4 text-muted-soft" />
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelected(inv);
                      setOpen(true);
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <InvoicePreviewDialog invoice={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
