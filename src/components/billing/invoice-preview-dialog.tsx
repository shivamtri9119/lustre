"use client";

import * as React from "react";
import { Printer, Download, Mail, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InvoiceTemplate } from "@/components/billing/invoice-template";
import type { Invoice } from "@/lib/types";

export function InvoicePreviewDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [justEmailed, setJustEmailed] = React.useState(false);

  if (!invoice) return null;

  // NOTE: Print and Download both use the browser's native print-to-PDF here.
  // A production backend would generate this server-side with PDFKit and
  // attach it to the automatic email — see README "Auto invoice delivery".
  function handlePrint() {
    window.print();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invoice {invoice.invoiceNumber}</DialogTitle>
          <DialogDescription>
            {invoice.emailSent ? "Emailed to customer" : "Not yet emailed"}
          </DialogDescription>
        </DialogHeader>

        <div id="print-area">
          <InvoiceTemplate invoice={invoice} />
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => setJustEmailed(true)}
            disabled={justEmailed}
          >
            {justEmailed ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-completed-fg" />
                Sent
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Email invoice
              </>
            )}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="gold" onClick={handlePrint}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
