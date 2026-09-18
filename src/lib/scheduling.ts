/**
 * Shared appointment-overlap logic.
 *
 * Previously this exact interval-overlap math lived only inside
 * `components/booking/time-step.tsx`, reading a frozen array imported
 * from `lib/mock-data.ts`. It was correct math wired to nothing: the
 * internal "New appointment" dialog didn't call it at all, and the public
 * booking page never wrote its bookings anywhere for it to see. Two
 * customers (or a customer and the front desk) could book the same
 * stylist for the same slot with zero warning.
 *
 * This version is the single source of truth, used server-side (as the
 * actual gate, in the API routes) and optionally client-side (for instant
 * "this slot is taken" UX — never as the security/consistency boundary,
 * since client-side checks can always be bypassed or stale).
 */

const OPEN_MINUTES = 10 * 60; // 10:00
const CLOSE_MINUTES = 19 * 60; // 19:00
const STEP_MINUTES = 30;

export interface BookedInterval {
  id: string;
  time: string; // "HH:mm"
  durationMinutes: number;
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function toTimeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * True if [candidateStart, candidateStart + duration) overlaps any interval
 * in `booked`. Pass `excludeAppointmentId` when checking a reschedule so an
 * appointment doesn't conflict with its own current slot.
 */
export function hasConflict(
  candidateTime: string,
  candidateDurationMinutes: number,
  booked: BookedInterval[],
  excludeAppointmentId?: string
): boolean {
  const start = toMinutes(candidateTime);
  const end = start + candidateDurationMinutes;

  return booked.some((b) => {
    if (excludeAppointmentId && b.id === excludeAppointmentId) return false;
    const bookedStart = toMinutes(b.time);
    const bookedEnd = bookedStart + b.durationMinutes;
    return start < bookedEnd && end > bookedStart;
  });
}

/** Open 30-minute slots for a given staff member/date, given their existing bookings. */
export function getAvailableSlots(
  booked: BookedInterval[],
  durationMinutes: number
): { minutes: number; value: string; label: string }[] {
  const slots: { minutes: number; value: string; label: string }[] = [];

  for (let m = OPEN_MINUTES; m + durationMinutes <= CLOSE_MINUTES; m += STEP_MINUTES) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    const value = `${hh}:${mm}`;
    if (!hasConflict(value, durationMinutes, booked)) {
      slots.push({ minutes: m, value, label: toTimeLabel(m) });
    }
  }
  return slots;
}
