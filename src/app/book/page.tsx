"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Clock, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/landing/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepIndicator } from "@/components/booking/step-indicator";
import { ServiceStep } from "@/components/booking/service-step";
import { StylistStep } from "@/components/booking/stylist-step";
import { DateStep } from "@/components/booking/date-step";
import { TimeStep } from "@/components/booking/time-step";
import { SocialFab } from "@/components/shared/social-fab";
import { WhatsAppIcon, InstagramIcon } from "@/components/shared/icons";
import { salon } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import type { PublicService, PublicStaff } from "@/lib/types";

const stepVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-gold/5 blur-3xl" />
    </div>
  );
}

function SocialRow() {
  return (
    <div className="flex items-center justify-center gap-3">
      <a
        href={salon.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition-transform hover:scale-110"
        aria-label="Chat on WhatsApp"
      >
        <WhatsAppIcon className="h-4 w-4" />
      </a>
      <a
        href={salon.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-ink transition-transform hover:scale-110"
        aria-label="Follow on Instagram"
      >
        <InstagramIcon className="h-4 w-4" />
      </a>
    </div>
  );
}

export default function BookPage() {
  const [step, setStep] = React.useState(1);
  const [service, setService] = React.useState<PublicService | null>(null);
  const [stylist, setStylist] = React.useState<PublicStaff | null>(null);
  const [date, setDate] = React.useState<string | null>(null);
  const [time, setTime] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [confirming, setConfirming] = React.useState(false);
  const [confirmError, setConfirmError] = React.useState<string | null>(null);
  const [confirmed, setConfirmed] = React.useState(false);
  const [reference, setReference] = React.useState("");

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!service || !stylist || !date || !time) return;
    setConfirmError(null);
    setConfirming(true);

    const res = await fetch("/api/public/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: service.id,
        staffId: stylist.id,
        date,
        time,
        customerName: name,
        customerPhone: phone,
      }),
    }).catch(() => null);

    setConfirming(false);

    if (!res || !res.ok) {
      const body = await res?.json().catch(() => null);
      setConfirmError(body?.error ?? "Couldn't confirm that booking. Please try again.");
      return;
    }

    const data = await res.json();
    setReference(data.reference.slice(-8).toUpperCase());
    setConfirmed(true);
  }

  if (confirmed && service && stylist && date && time) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-bg px-6 py-16">
        <AmbientBackground />
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 text-center shadow-xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
            >
              <CheckCircle2 className="mx-auto h-10 w-10 text-completed-fg" />
            </motion.div>
            <h1 className="mt-4 font-display text-xl font-semibold text-ink">
              Request sent, {name.split(" ")[0]}!
            </h1>
            <p className="mt-2 text-sm text-muted">
              Reference <span className="font-medium text-ink">{reference}</span> ·
              our team will confirm your slot shortly.
            </p>

            <div className="mt-6 space-y-2 rounded-lg bg-ivory p-4 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Service</span>
                <span className="font-medium text-ink">{service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Stylist</span>
                <span className="font-medium text-ink">{stylist.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">When</span>
                <span className="font-medium text-ink">{date} · {time}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2">
                <span className="text-muted">Amount due</span>
                <span className="font-display font-semibold text-ink">{formatCurrency(service.price)}</span>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-6">
              <Button asChild variant="gold" size="lg" className="w-full">
                <Link href="/">Back to homepage</Link>
              </Button>
            </motion.div>

            <p className="mt-6 text-xs font-medium uppercase tracking-wide text-muted-soft">
              Stay connected
            </p>
            <div className="mt-3">
              <SocialRow />
            </div>
          </Card>
        </motion.div>
        <SocialFab />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-bg">
      <AmbientBackground />

      <header className="relative border-b border-line bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="hidden items-center gap-5 text-xs text-muted sm:flex">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {salon.address.split(",").slice(-2).join(",")}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" /> {salon.phone}
            </span>
            <div className="flex items-center gap-2">
              <a
                href={salon.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white transition-transform hover:scale-110"
                aria-label="Chat on WhatsApp"
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
              </a>
              <a
                href={salon.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-ink transition-transform hover:scale-110"
                aria-label="Follow on Instagram"
              >
                <InstagramIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-2xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <p className="cut-line font-display text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">
            Book online
          </p>
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight text-ink">
            {salon.name}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Pick a service, stylist, and time that works for you.
          </p>
        </motion.div>

        <div className="mb-8">
          <StepIndicator current={step} />
        </div>

        <div className="mb-4 flex h-5 items-center justify-between">
          {step > 1 ? (
            <button
              onClick={back}
              className="flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          ) : (
            <span />
          )}
          {(service || stylist || date) && step < 5 && (
            <p className="text-xs text-muted-soft">
              {[service?.name, stylist?.name, date].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {step === 1 && (
              <ServiceStep
                onSelect={(s) => {
                  setService(s);
                  setStylist(null);
                  setStep(2);
                }}
              />
            )}

            {step === 2 && service && (
              <StylistStep
                key={service.id}
                service={service}
                onSelect={(s) => {
                  setStylist(s);
                  setStep(3);
                }}
              />
            )}

            {step === 3 && (
              <DateStep
                onSelect={(d) => {
                  setDate(d);
                  setStep(4);
                }}
              />
            )}

            {step === 4 && stylist && date && service && (
              <TimeStep
                key={`${service.id}:${stylist.id}:${date}`}
                staff={stylist}
                date={date}
                serviceId={service.id}
                onSelect={(t) => {
                  setTime(t);
                  setStep(5);
                }}
              />
            )}

            {step === 5 && service && stylist && date && time && (
              <Card className="p-6 shadow-lg">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <p className="font-display text-base font-semibold text-ink">{service.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                      <Clock className="h-3.5 w-3.5" /> with {stylist.name} · {date} · {time}
                    </p>
                  </div>
                  <p className="font-display text-lg font-semibold text-gold-deep">
                    {formatCurrency(service.price)}
                  </p>
                </div>

                <form onSubmit={handleConfirm} className="mt-5 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="b-name">Your name</Label>
                      <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="b-phone">Mobile number</Label>
                      <Input id="b-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>
                  </div>
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                    <Button type="submit" variant="gold" size="lg" className="w-full" disabled={confirming}>
                      {confirming ? "Confirming…" : "Confirm booking"}
                    </Button>
                  </motion.div>
                  {confirmError && (
                    <p className="rounded-md border border-cancelled-fg/30 bg-cancelled-bg px-3 py-2 text-sm text-cancelled-fg">
                      {confirmError}
                    </p>
                  )}
                </form>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <SocialFab />
    </div>
  );
}
