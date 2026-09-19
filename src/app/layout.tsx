import type { Metadata } from "next";
import { connection } from "next/server";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: "Lustre — Salon Management, Effortless",
  description:
    "Appointments, billing, staff management & customer tracking in one place. The premium salon management platform built for real salon operations.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The CSP in src/proxy.ts uses a per-request nonce. Next can only attach
  // that nonce to its <script> tags when the page is rendered per request,
  // not prerendered at build time. Without this, static pages (/, /login,
  // /signup) ship un-nonced scripts that the browser blocks, so React never
  // hydrates: blank /login, invisible hero, dead Google button.
  await connection();
  return (
    <html lang="en" style={{ "--font-inter": "Inter, sans-serif", "--font-poppins": "Poppins, sans-serif" } as React.CSSProperties}>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
