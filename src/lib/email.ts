/**
 * No email provider is wired up anywhere in this app yet (the same gap
 * noted in the billing README section for "Auto invoice delivery"). Rather
 * than block the password-reset security fix on that separate piece of
 * work, this logs the email to the server console — good enough for local
 * dev/demo, and it keeps the real security logic (token generation,
 * hashing, expiry, single-use) fully working and testable right now.
 *
 * TODO before production: replace the console.log below with a real
 * provider call (Resend, Postmark, or SMTP via nodemailer are the common
 * choices for a Next.js app on Vercel). Keep the function signature the
 * same so nothing calling it needs to change.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  console.log(`[email:password-reset] To: ${to}`);
  console.log(`[email:password-reset] Link: ${resetUrl}`);
}
