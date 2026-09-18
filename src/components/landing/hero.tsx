"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, IndianRupee, Users, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const liveFeed = [
  { name: "Neha Kapoor", service: "Hair Color – Global", time: "10:00 AM", status: "confirmed" as const },
  { name: "Ritika Joshi", service: "Bridal Makeup Trial", time: "2:00 PM", status: "pending" as const },
  { name: "Arjun Verma", service: "Beard Styling", time: "11:00 AM", status: "completed" as const },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="cut-line font-display text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep"
          >
            Built for real salon floors
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-7 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]"
          >
            Manage Your Salon, Effortlessly
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 max-w-md text-lg leading-relaxed text-muted"
          >
            Appointments, billing, staff management & customer tracking in
            one place — no more diary pages, WhatsApp screenshots, or
            end-of-day guesswork.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button variant="gold" size="lg" asChild>
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="#contact">Book Demo</Link>
            </Button>
          </motion.div>

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted">
            <span>
              <strong className="font-display font-semibold text-ink">600+</strong> salons onboarded
            </span>
            <span>
              <strong className="font-display font-semibold text-ink">2.1M+</strong> appointments booked
            </span>
            <span>
              <strong className="font-display font-semibold text-ink">4.9/5</strong> average rating
            </span>
          </div>
        </div>

        {/* Dashboard mockup preview — built from the same UI components used in-app */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative"
        >
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-gold/15 via-transparent to-transparent blur-2xl" />
          <Card className="rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="font-display text-sm font-semibold text-ink">Aura Salon & Spa</p>
                <p className="text-xs text-muted">Today · Wed, 25 Jun</p>
              </div>
              <Badge variant="gold">Live</Badge>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-ivory p-3">
                <IndianRupee className="h-3.5 w-3.5 text-gold-deep" />
                <p className="mt-2 font-display text-lg font-semibold text-ink">₹13,013</p>
                <p className="text-[11px] text-muted">Today&apos;s revenue</p>
              </div>
              <div className="rounded-lg bg-ivory p-3">
                <Calendar className="h-3.5 w-3.5 text-gold-deep" />
                <p className="mt-2 font-display text-lg font-semibold text-ink">5</p>
                <p className="text-[11px] text-muted">Bookings today</p>
              </div>
              <div className="rounded-lg bg-ivory p-3">
                <Users className="h-3.5 w-3.5 text-gold-deep" />
                <p className="mt-2 font-display text-lg font-semibold text-ink">312</p>
                <p className="text-[11px] text-muted">Active customers</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                Upcoming
              </p>
              <div className="space-y-2">
                {liveFeed.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg border border-line bg-card px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{item.name}</p>
                      <p className="text-xs text-muted">{item.service}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted">{item.time}</p>
                      <Badge
                        variant={item.status}
                        className="mt-1"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-completed-fg">
              <ArrowUpRight className="h-3.5 w-3.5" />
              7.2% growth vs last month
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
