"use client";

import * as React from "react";
import { Menu, Bell, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { SidebarBrand, SidebarNav } from "@/components/dashboard/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { NewAppointmentDialog } from "@/components/appointments/new-appointment-dialog";
import { initials } from "@/lib/utils";
import type { Role } from "@/lib/types";
import type { SubscriptionState } from "@/lib/subscription";

const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  RECEPTIONIST: "Receptionist",
  STYLIST: "Stylist",
  CUSTOMER: "Customer",
};

function formatRenewalDate(date: Date) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function Topbar({ subscription }: { subscription?: SubscriptionState }) {
  const { data: session } = useSession();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const name = session?.user?.name ?? "";
  const role = session?.user?.role;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-card/95 px-4 backdrop-blur-md sm:px-6">
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col">
          <SidebarBrand />
          <SidebarNav onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      {/* Owner-only: a quiet, factual reminder that this is a paid,
          running subscription — not a nag, just the same kind of status a
          real business dashboard would surface. Hidden for other roles;
          billing isn't their concern. */}
      {role === "OWNER" && subscription?.currentPeriodEnd && (
        <span className="hidden items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs text-muted md:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          {subscription.trial ? "Free trial ends" : "Renews"}{" "}
          {formatRenewalDate(subscription.currentPeriodEnd)}
        </span>
      )}

      {/* Used to be a "Viewing as" dropdown anyone could click to become
          Owner — that was the entire access-control model. Now it's a
          read-only label sourced from the real, server-verified session;
          there's nothing here to click because changing your role isn't
          supposed to be a client-side action. */}
      {role && (
        <span className="hidden rounded-md border border-line px-3 py-1.5 text-sm text-ink/60 sm:inline-flex">
          {ROLE_LABELS[role]}
        </span>
      )}

      <NewAppointmentDialog />

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-4.5 w-4.5" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold" />
        <span className="sr-only">Notifications</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials(name || "?")}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
