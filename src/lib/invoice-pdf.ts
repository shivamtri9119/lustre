import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

/**
 * Text-only invoice PDF — no logo, no images. Deliberately a plain,
 * lightweight layout (pdf-lib, no headless browser) so it generates in
 * milliseconds on Render's cheapest instance instead of needing Puppeteer.
 */

export interface InvoicePdfItem {
  serviceName: string;
  qty: number;
  price: number;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  createdAt: Date;
  salon: { name: string; address: string; phone: string; email: string; gstin: string | null };
  customer: { name: string; phone: string };
  items: InvoicePdfItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
}

const PAGE_W = 420;
const PAGE_H = 595;
const MARGIN = 40;

function formatINR(amount: number): string {
  return `Rs. ${amount.toFixed(2)}`;
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0.1, 0.1, 0.1);
  const gray = rgb(0.45, 0.45, 0.45);
  let y = PAGE_H - MARGIN;

  function text(
    str: string,
    opts: { size?: number; f?: PDFFont; color?: ReturnType<typeof rgb>; x?: number } = {}
  ) {
    const { size = 10, f = font, color = black, x = MARGIN } = opts;
    page.drawText(str, { x, y, size, font: f, color });
  }
  function textRight(str: string, opts: { size?: number; f?: PDFFont; color?: ReturnType<typeof rgb> } = {}) {
    const { size = 10, f = font, color = black } = opts;
    const w = f.widthOfTextAtSize(str, size);
    page.drawText(str, { x: PAGE_W - MARGIN - w, y, size, font: f, color });
  }
  function hr() {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 0.5,
      color: gray,
    });
  }

  // Header — salon details, text only
  text(data.salon.name, { size: 15, f: bold });
  y -= 18;
  text(data.salon.address, { size: 9, color: gray });
  y -= 12;
  text(`${data.salon.phone}${data.salon.email ? " \u00B7 " + data.salon.email : ""}`, {
    size: 9,
    color: gray,
  });
  y -= 12;
  if (data.salon.gstin) {
    text(`GSTIN ${data.salon.gstin}`, { size: 9, color: gray });
    y -= 12;
  }
  y -= 10;
  hr();
  y -= 20;

  // Invoice meta
  text(`Invoice ${data.invoiceNumber}`, { size: 12, f: bold });
  y -= 14;
  text(
    data.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    { size: 9, color: gray }
  );
  y -= 20;

  // Customer + payment
  text(`Billed to: ${data.customer.name}`, { size: 10 });
  y -= 13;
  text(`Phone: ${data.customer.phone}`, { size: 9, color: gray });
  y -= 13;
  text(`Payment: ${data.paymentMethod} \u00B7 ${data.paymentStatus}`, { size: 9, color: gray });
  y -= 18;
  hr();
  y -= 18;

  // Line items
  text("Service", { size: 9, f: bold });
  textRight("Amount", { size: 9, f: bold });
  y -= 16;

  for (const item of data.items) {
    const label = item.qty > 1 ? `${item.serviceName} x${item.qty}` : item.serviceName;
    text(label, { size: 10 });
    textRight(formatINR(item.price * item.qty), { size: 10 });
    y -= 16;
  }

  y -= 2;
  hr();
  y -= 16;

  text("Subtotal", { size: 9, color: gray });
  textRight(formatINR(data.subtotal), { size: 9, color: gray });
  y -= 15;

  if (data.discount > 0) {
    text("Discount", { size: 9, color: gray });
    textRight(`-${formatINR(data.discount)}`, { size: 9, color: gray });
    y -= 15;
  }

  text("Tax (GST)", { size: 9, color: gray });
  textRight(formatINR(data.tax), { size: 9, color: gray });
  y -= 18;
  hr();
  y -= 18;

  text("Total", { size: 12, f: bold });
  textRight(formatINR(data.total), { size: 12, f: bold });
  y -= 34;

  text(`Thank you for visiting ${data.salon.name}.`, { size: 8, color: gray });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
