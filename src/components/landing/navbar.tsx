import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <span className="relative flex h-7 w-7 items-center justify-center rounded-md bg-ink">
        <span className="h-2 w-2 rounded-full bg-gold transition-transform group-hover:scale-125" />
      </span>
      <span
        className={`font-display text-lg font-semibold tracking-tight ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        Lustre
      </span>
    </Link>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-soft md:flex">
          <Link href="#features" className="hover:text-ink transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="hover:text-ink transition-colors">
            Pricing
          </Link>
          <Link href="#testimonials" className="hover:text-ink transition-colors">
            Stories
          </Link>
          <Link href="#faq" className="hover:text-ink transition-colors">
            FAQ
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:inline-block"
          >
            Log in
          </Link>
          <Button variant="gold" size="sm" asChild>
            <Link href="/signup">Start Free Trial</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
