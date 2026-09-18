import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * No payment gateway keys are configured in this environment (same
 * situation as email — see src/lib/email.ts). Razorpay is the standard
 * choice for an India-first SaaS charging in INR (UPI, cards, netbanking
 * all supported out of the box). This talks to Razorpay's REST API
 * directly rather than pulling in their Node SDK — one less dependency
 * for two calls (create order, nothing else server-side needs the SDK).
 *
 * To go live: create a Razorpay account, add RAZORPAY_KEY_ID and
 * RAZORPAY_KEY_SECRET to your environment, and everything below works
 * without further code changes.
 */

export class PaymentGatewayNotConfiguredError extends Error {
  constructor() {
    super("Payments aren't configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable checkout.");
  }
}

function getCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new PaymentGatewayNotConfiguredError();
  return { keyId, keySecret };
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

/** Creates a Razorpay order for the given amount (in whole rupees). */
export async function createOrder(amountInr: number, receipt: string): Promise<RazorpayOrder> {
  const { keyId, keySecret } = getCredentials();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: amountInr * 100, // paise
      currency: "INR",
      receipt,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Razorpay order creation failed (${res.status}): ${body}`);
  }
  return res.json();
}

/**
 * Verifies the signature Razorpay's checkout returns after a successful
 * payment. This is the step that actually proves the payment happened —
 * never mark a subscription active just because the client says "it
 * worked" (see PHASE 3.14 in the security audit: never trust the client
 * to determine whether a payment succeeded).
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = getCredentials();
  const expected = createHmac("sha256", keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(params.signature, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
