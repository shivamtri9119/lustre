import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSubscriptionState } from "@/lib/subscription";
import { SubscribeClient } from "@/components/billing/subscribe-client";
import { Logo } from "@/components/landing/navbar";

const brandPoints = [
  "Every appointment, invoice, and rupee in one place — no more three notebooks and a WhatsApp group",
  "Payments verified server-side before an invoice is ever marked paid",
  "Each stylist sees only their own schedule; your data never mixes with another salon's",
];

export default async function SubscribePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.salonId) redirect("/login?error=NoSalon");

  const subscription = await getSubscriptionState(session.user.salonId);
  if (subscription.active) redirect("/dashboard");

  const isOwner = session.user.role === "OWNER";

  // Non-owner roles can't pay — show them who to ask instead of a
  // payment form they have no way to complete.
  const owner = isOwner
    ? null
    : await prisma.user.findFirst({
        where: { salonId: session.user.salonId, role: "OWNER" },
        select: { name: true, email: true },
      });

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="hidden flex-col justify-between bg-ink p-10 lg:flex">
        <Logo dark />
        <div>
          <p className="cut-line font-display text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            Your subscription
          </p>
          <h2 className="mt-6 max-w-sm font-display text-3xl font-semibold leading-snug text-white">
            One subscription. Every chair, every booking, every rupee tracked.
          </h2>
          <ul className="mt-8 space-y-5">
            {brandPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-white/85">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <span className="text-base leading-snug">{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} Lustre. All rights reserved.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>
        <SubscribeClient
          isOwner={isOwner}
          ownerName={owner?.name ?? null}
          ownerEmail={owner?.email ?? null}
          hadPreviousPlan={subscription.plan !== null}
        />
      </div>
    </div>
  );
}
