import Link from "next/link";
import { Logo } from "@/components/landing/navbar";

const brandPoints = [
  "Book a walk-in while they're still at the counter",
  "Invoices email themselves the moment payment lands",
  "Every stylist sees only their own schedule",
];

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink p-10 lg:flex">
        <Logo dark />
        <div>
          <p className="cut-line font-display text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            Why salons switch to Lustre
          </p>
          <ul className="mt-8 space-y-5">
            {brandPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-white/85">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <span className="text-lg leading-snug">{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} Lustre. All rights reserved.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-xs text-muted-soft">
            <Link href="/" className="hover:text-ink">
              ← Back to homepage
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
