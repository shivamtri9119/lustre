import Link from "next/link";
import { Logo } from "@/components/landing/navbar";

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo dark />
            <p className="mt-3 max-w-xs text-sm text-white/60">
              Salon management software built for real operations, not demos.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div className="space-y-2">
              <p className="font-medium text-white">Product</p>
              <Link href="#features" className="block text-white/60 hover:text-white">Features</Link>
              <Link href="#pricing" className="block text-white/60 hover:text-white">Pricing</Link>
              <Link href="/book" className="block text-white/60 hover:text-white">Online booking</Link>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-white">Company</p>
              <Link href="#testimonials" className="block text-white/60 hover:text-white">Stories</Link>
              <Link href="#faq" className="block text-white/60 hover:text-white">FAQ</Link>
              <Link href="#contact" className="block text-white/60 hover:text-white">Contact</Link>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-white">Account</p>
              <Link href="/login" className="block text-white/60 hover:text-white">Log in</Link>
              <Link href="/signup" className="block text-white/60 hover:text-white">Start free trial</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/40">
          © {new Date().getFullYear()} Lustre. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
