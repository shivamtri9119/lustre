import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ "--font-inter": "Inter, sans-serif", "--font-poppins": "Poppins, sans-serif" } as React.CSSProperties}>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
