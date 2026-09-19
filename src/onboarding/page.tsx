import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthLayout } from "@/components/auth/auth-layout";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { TRIAL_DAYS } from "@/lib/subscription";

// Second step of "Sign up with Google": the Google account exists, but it
// has no salon yet. Collects the salon name, then /api/onboarding creates
// the salon and starts the free trial.
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.salonId) redirect("/dashboard");
  // Only a brand-new Google account belongs here (see /api/onboarding).
  if (
    session.user.role !== "CUSTOMER" ||
    session.user.customerId ||
    session.user.staffId
  ) {
    redirect("/login?error=NoSalon");
  }

  return (
    <AuthLayout
      title="One last step"
      subtitle={`Name your salon to start your ${TRIAL_DAYS}-day free trial.`}
    >
      <OnboardingForm trialDays={TRIAL_DAYS} />
    </AuthLayout>
  );
}
