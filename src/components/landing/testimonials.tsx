import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Megha Rastogi",
    role: "Owner, Glow Studio — Lucknow",
    quote:
      "My receptionist used to spend the first hour of every shift just calling people to confirm bookings. Now the reminders go out on their own and our no-show rate dropped by half.",
  },
  {
    name: "Imran Qureshi",
    role: "Owner, The Gentlemen's Room — Kanpur",
    quote:
      "Commission tracking used to take me an entire Sunday with a notebook and a calculator. It's automatic now, and my stylists trust the numbers because they can see them too.",
  },
  {
    name: "Tanvi Oberoi",
    role: "Owner, Tanvi's Atelier — Farrukhabad",
    quote:
      "We went from a paper diary to a real dashboard in a weekend. Customers book themselves online now, which we genuinely didn't think our clientele would do — they love it.",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-bg py-24">
      <div className="mx-auto max-w-7xl px-6">
        <span className="cut-line font-display text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">
          From real salon floors
        </span>
        <h2 className="mt-6 max-w-lg font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Owners who got their Sundays back
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="flex flex-col gap-5 p-6">
              <div className="flex gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-ink-soft">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-auto flex items-center gap-3 pt-2">
                <Avatar>
                  <AvatarFallback>
                    {t.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-ink">{t.name}</p>
                  <p className="text-xs text-muted">{t.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
