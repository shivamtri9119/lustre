import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingPortal } from "@/components/booking/booking-portal";
import { findSalonBySlug } from "@/lib/public-salon";
import { getSubscriptionState } from "@/lib/subscription";

type Props = { params: Promise<{ slug: string }> };

// The tab title and the preview card when a link is shared on WhatsApp both
// carry the salon's own name.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const salon = await findSalonBySlug(slug);
  if (!salon) return { title: "Booking page not found" };
  return {
    title: `Book an appointment · ${salon.name}`,
    description: `Book your appointment online at ${salon.name}. Pick a service, stylist and time.`,
  };
}

// One salon's public booking page: /book/<slug>.
export default async function SalonBookingPage({ params }: Props) {
  const { slug } = await params;
  const salon = await findSalonBySlug(slug);
  if (!salon) notFound();

  // A salon whose trial/subscription has lapsed can't log in to see
  // bookings, so it shouldn't take them either.
  const { active } = await getSubscriptionState(salon.id);
  if (!active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-6">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-xl font-semibold text-ink">{salon.name}</h1>
          <p className="mt-3 text-sm text-muted">
            Online booking isn&apos;t available right now.
            {salon.phone ? ` Please call ${salon.phone} to book.` : " Please contact the salon directly."}
          </p>
          <Link href="/" className="mt-6 inline-block text-xs text-muted-soft hover:text-ink">
            Powered by Lustre
          </Link>
        </div>
      </div>
    );
  }

  return (
    <BookingPortal
      salonName={salon.name}
      salonSlug={salon.slug ?? slug}
      address={salon.address}
      phone={salon.phone}
    />
  );
}
