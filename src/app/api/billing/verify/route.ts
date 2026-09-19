import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSalonSession, handleApiError } from "@/lib/session-guard";
import { verifyPaymentSignature, PaymentGatewayNotConfiguredError } from "@/lib/razorpay";

const schema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  plan: z.enum(["MONTHLY", "YEARLY"]),
});

const PERIOD_DAYS = { MONTHLY: 30, YEARLY: 365 } as const;

export async function POST(req: Request) {
  try {
    const session = await requireSalonSession(["OWNER"], { skipSubscriptionCheck: true });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid verification payload" }, { status: 400 });
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = parsed.data;

    // The actual proof of payment — never trust the client's "it worked",
    // only this signature check (see the note in src/lib/razorpay.ts).
    const valid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) {
      return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 });
    }

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + PERIOD_DAYS[plan]);

    await prisma.subscription.upsert({
      where: { salonId: session.salonId },
      create: {
        salonId: session.salonId,
        plan,
        status: "ACTIVE",
        isTrial: false,
        currentPeriodEnd,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
      update: {
        plan,
        status: "ACTIVE",
        isTrial: false,
        currentPeriodEnd,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    return NextResponse.json({ success: true, currentPeriodEnd });
  } catch (err) {
    if (err instanceof PaymentGatewayNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return handleApiError(err);
  }
}

