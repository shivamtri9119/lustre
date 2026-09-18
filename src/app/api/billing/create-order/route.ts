import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSalonSession, handleApiError } from "@/lib/session-guard";
import { createOrder, PaymentGatewayNotConfiguredError } from "@/lib/razorpay";
import { PLAN_PRICING } from "@/lib/subscription";

const schema = z.object({ plan: z.enum(["MONTHLY", "YEARLY"]) });

export async function POST(req: Request) {
  try {
    // Only the salon owner can start a purchase — a receptionist or
    // stylist login shouldn't be able to spend the salon's money.
    const session = await requireSalonSession(["OWNER"], { skipSubscriptionCheck: true });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose a valid plan" }, { status: 400 });
    }
    const { plan } = parsed.data;
    const amountInr = PLAN_PRICING[plan].amountInr;

    const order = await createOrder(amountInr, `sub_${session.salonId}_${Date.now()}`);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // public key, safe to expose to the client
      plan,
    });
  } catch (err) {
    if (err instanceof PaymentGatewayNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return handleApiError(err);
  }
}
