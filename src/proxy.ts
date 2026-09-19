import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 renamed middleware.ts -> proxy.ts and narrowed its job to the
// network/routing boundary (redirects, rewrites, headers) — not auth logic.
// That narrowing followed CVE-2025-29927, where relying on a routing-layer
// gate as the *only* auth check let requests bypass it. So this file does
// exactly one cheap auth-adjacent thing: if there's no session cookie at
// all, bounce to /login before the page even renders, so a logged-out
// visitor doesn't see a flash of the dashboard shell. It intentionally does
// NOT decode the session, check roles, or touch the database.
//
// The real check — is this session valid, and does session.salonId match
// the data being requested — happens in every route via
// src/lib/session-guard.ts's requireSalonSession(). That's what actually
// enforces multi-tenant isolation. If you only remember one thing from this
// file: deleting it does not remove your auth checks; deleting
// session-guard.ts calls from a route would.
//
// This file also sets response headers (F-03, security audit) — a pure
// routing/network concern, same category as the redirect above, not a
// second auth layer.

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/appointments",
  "/customers",
  "/staff",
  "/services",
  "/billing",
  "/inventory",
  "/analytics",
  "/subscribe",
  "/onboarding",
];

/**
 * Builds the CSP for a request, given a fresh per-request nonce.
 *
 * Trade-offs, spelled out rather than silently loosened:
 * - script-src uses a nonce + 'strict-dynamic' (modern browsers ignore the
 *   'self' fallback once strict-dynamic is present; older browsers fall
 *   back to it) — this is the strong option and doesn't need unsafe-inline.
 * - style-src keeps 'unsafe-inline'. Framer Motion animates by writing
 *   directly to elements' `style` attribute, and CSP has no nonce
 *   mechanism for inline style *attributes* (only for <style> elements) —
 *   removing unsafe-inline here would break every animation in the app.
 *   Tailwind's own output is static CSS files and doesn't need it.
 * - frame-ancestors 'none' blocks the app from being iframed anywhere
 *   (clickjacking defense) — revisit if an embeddable widget is ever added.
 */
function buildCsp(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

function applySecurityHeaders(headers: Headers, csp: string) {
  headers.set("Content-Security-Policy", csp);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // X-Frame-Options is redundant with frame-ancestors above for modern
  // browsers, but kept as defense-in-depth for the handful that don't
  // honor frame-ancestors.
  headers.set("X-Frame-Options", "DENY");
  // Only meaningful once actually served over HTTPS (e.g. Vercel) — harmless
  // to send in a local http:// dev environment, browsers ignore it there.
  headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    // Default Auth.js v5 JWT session cookie names (dev / secure-prod). Verify
    // against your deployed version if you rename cookies or add a custom
    // cookie config in auth.ts — a mismatch here just means an extra
    // redirect flicker, not a security gap, since every route re-checks the
    // real session independently.
    const hasSession =
      request.cookies.has("authjs.session-token") ||
      request.cookies.has("__Secure-authjs.session-token");

    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Forward the nonce to Server Components (via `headers()`) so any inline
  // script this app adds later can carry it, and so Next's own
  // framework-injected scripts (which read the nonce off this same
  // response header) are allowed under the CSP above.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  applySecurityHeaders(requestHeaders, csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  applySecurityHeaders(response.headers, csp);
  return response;
}

export const config = {
  matcher: [
    // Run on every page request except static assets and image
    // optimization, so the CSP/security headers above apply everywhere
    // (landing page, /login, /signup, /book) — not just the dashboard
    // routes the auth-redirect logic cares about.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
