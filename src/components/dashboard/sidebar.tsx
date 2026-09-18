"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Scissors,
  Sparkles,
  ReceiptText,
  Boxes,
  LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

const navItems: { href: string; label: string; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["OWNER", "RECEPTIONIST", "STYLIST"] },
  { href: "/appointments", label: "Appointments", icon: CalendarCheck, roles: ["OWNER", "RECEPTIONIST", "STYLIST"] },
  { href: "/customers", label: "Customers", icon: Users, roles: ["OWNER", "RECEPTIONIST", "STYLIST"] },
  { href: "/staff", label: "Staff", icon: Scissors, roles: ["OWNER"] },
  { href: "/services", label: "Services", icon: Sparkles, roles: ["OWNER"] },
  { href: "/billing", label: "Billing & Invoices", icon: ReceiptText, roles: ["OWNER", "RECEPTIONIST"] },
  { href: "/inventory", label: "Inventory", icon: Boxes, roles: ["OWNER"] },
  { href: "/analytics", label: "Analytics", icon: LineChart, roles: ["OWNER"] },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  // Nav filtering is a UX convenience, not the security boundary — a role
  // could still hit a URL directly. The real check is in every /api route
  // (see src/lib/session-guard.ts). While the session is resolving
  // client-side, show nothing rather than a flash of items the role can't
  // actually use.
  const role = session?.user?.role;
  const items = role ? navItems.filter((item) => item.roles.includes(role)) : [];

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-white/10 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-gold" />
            )}
            <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarBrand() {
  return (
    <div className="flex h-16 items-center gap-2 px-5">
      <span className="relative flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
        <span className="h-2 w-2 rounded-full bg-gold" />
      </span>
      <span className="font-display text-lg font-semibold text-white">Lustre</span>
    </div>
  );
}

export function Sidebar() {
  const { data: session } = useSession();

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-ink lg:flex">
      <SidebarBrand />
      <SidebarNav />
      <div className="truncate px-5 py-4 text-xs text-white/40">
        {session?.user?.salonName ?? "Lustre"} · v1.0
      </div>
    </aside>
  );
}
