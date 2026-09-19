import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { AppointmentsProvider } from "@/lib/appointments-store";
import { getSubscriptionState } from "@/lib/subscription";

// This is the second of three layers checking auth (proxy.ts does a cheap
// cookie-presence redirect; every /api route independently re-verifies via
// session-guard.ts). Checking here too — in a Server Component, with the
// real session — means even a direct request that somehow skipped proxy.ts
// still never renders the dashboard shell for a logged-out visitor. Before
// this, the file had NO guard of any kind: (dashboard)/layout.tsx used to
// just mount a client-side "fake role" context and render children
// unconditionally.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!session.user.salonId) {
    // A brand-new Google sign-up (the adapter's default CUSTOMER role, no
    // staff/customer link) hasn't created its salon yet — send it to
    // onboarding. Anyone else without a salon has nothing to onboard into.
    if (
      session.user.role === "CUSTOMER" &&
      !session.user.customerId &&
      !session.user.staffId
    ) {
      redirect("/onboarding");
    }
    redirect("/login?error=NoSalon");
  }

  // Paid access gate. One subscription per salon, so every login for that
  // salon — owner, receptionist, or stylist — is checked the same way;
  // /subscribe itself decides what to show based on the visitor's role
  // (only OWNER can complete a purchase).
  const subscription = await getSubscriptionState(session.user.salonId);
  if (!subscription.active) {
    redirect("/subscribe");
  }

  return (
    <AppointmentsProvider>
      <div className="flex min-h-screen bg-bg">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar subscription={subscription} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AppointmentsProvider>
  );
}
