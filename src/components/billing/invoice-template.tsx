import { salon } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

export function InvoiceTemplate({ invoice }: { invoice: Invoice }) {
  return (
    <div className="rounded-lg border border-line bg-white p-8 text-ink">
      <div className="flex items-start justify-between border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-ink">
            <span className="h-2.5 w-2.5 rounded-full bg-gold" />
          </span>
          <div>
            <p className="font-display text-lg font-semibold">{salon.name}</p>
            <p className="text-xs text-muted">{salon.address}</p>
            <p className="text-xs text-muted">
              {salon.phone} · {salon.email} · GSTIN {salon.gstin}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-gold-deep">
            Invoice
          </p>
          <p className="mt-1 text-sm text-ink-soft">{invoice.invoiceNumber}</p>
          <p className="text-xs text-muted">{invoice.date}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-between text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Billed to</p>
          <p className="mt-1 font-medium text-ink">{invoice.customerName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Payment</p>
          <p className="mt-1 font-medium text-ink">{invoice.paymentMethod.replace("_", " ")}</p>
        </div>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <th className="py-2">Service</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.serviceName} className="border-b border-line/70">
              <td className="py-2.5">{item.serviceName}</td>
              <td className="py-2.5 text-center">{item.qty}</td>
              <td className="py-2.5 text-right">{formatCurrency(item.price)}</td>
              <td className="py-2.5 text-right">{formatCurrency(item.price * item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="w-56 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-muted">
              <span>Discount</span>
              <span>−{formatCurrency(invoice.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted">
            <span>Tax (GST)</span>
            <span>{formatCurrency(invoice.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-1.5 font-display text-base font-semibold text-ink">
            <span>Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-muted-soft">
        Thank you for visiting {salon.name}. See you again soon.
      </p>
    </div>
  );
}
