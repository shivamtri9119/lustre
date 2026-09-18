export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.83.5 3.6 1.46 5.15L2 22l5.1-1.53a9.84 9.84 0 0 0 4.93 1.32h.01c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm5.78 14.06c-.24.68-1.41 1.3-1.94 1.38-.5.08-1.12.11-1.81-.11a14.6 14.6 0 0 1-2.21-.84c-2.66-1.29-4.4-3.95-4.53-4.13-.13-.18-1.08-1.45-1.08-2.77s.68-1.96.92-2.23c.24-.27.53-.34.71-.34.18 0 .35.001.5.008.16.007.38-.06.59.46.24.59.81 2.03.88 2.18.07.15.12.32.02.51-.1.19-.15.31-.3.48-.15.17-.31.38-.45.51-.15.14-.3.29-.13.58.18.29.79 1.32 1.7 2.13 1.17 1.04 2.16 1.37 2.46 1.52.3.15.47.13.65-.05.18-.18.74-.81.94-1.1.2-.28.4-.23.66-.13.27.1 1.71.83 2.01.98.3.15.5.22.57.34.07.13.07.72-.17 1.4Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
