"use client";

import { motion } from "framer-motion";
import { WhatsAppIcon, InstagramIcon } from "@/components/shared/icons";
import { salon } from "@/lib/mock-data";

const buttons = [
  {
    href: salon.whatsapp,
    label: "Chat on WhatsApp",
    icon: WhatsAppIcon,
    className: "bg-ink text-white",
    pulse: true,
  },
  {
    href: salon.instagram,
    label: "Follow on Instagram",
    icon: InstagramIcon,
    className: "bg-gold text-ink",
    pulse: false,
  },
];

export function SocialFab() {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {buttons.map((btn, i) => (
        <motion.a
          key={btn.label}
          href={btn.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={btn.label}
          initial={{ opacity: 0, y: 16, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 + i * 0.12 }}
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.94 }}
          className="group relative flex h-12 w-12 items-center justify-center"
        >
          {btn.pulse && (
            <motion.span
              className="absolute inset-0 rounded-full bg-ink/40"
              animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <span
            className={`relative flex h-12 w-12 items-center justify-center rounded-full shadow-lg ring-1 ring-black/5 ${btn.className}`}
          >
            <btn.icon className="h-5 w-5" />
          </span>
          <span className="pointer-events-none absolute right-[3.5rem] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
            {btn.label}
          </span>
        </motion.a>
      ))}
    </div>
  );
}
