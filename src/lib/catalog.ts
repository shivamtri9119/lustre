import { Prisma } from "@prisma/client";
import { z } from "zod";
import { colorFromId } from "@/lib/utils";

// Shared by /api/services and /api/staff (and their /[id] routes): the
// input rules for a salon's services and staff, and the shapes returned to
// the dashboard. Route files can't export anything but handlers, so the
// schemas live here.

const staffIds = z.array(z.string().min(1)).max(100);
const serviceIds = z.array(z.string().min(1)).max(100);

export const serviceInputSchema = z.object({
  name: z.string().trim().min(1, "Enter a service name").max(80, "Service name is too long"),
  category: z.string().trim().min(1, "Pick a category").max(40),
  durationMinutes: z
    .number("Enter the duration in minutes")
    .int("Duration must be a whole number of minutes")
    .min(5, "Duration must be at least 5 minutes")
    .max(480, "Duration can't be more than 8 hours"),
  price: z
    .number("Enter a price")
    .min(0, "Price can't be negative")
    .max(1_000_000, "That price looks too high"),
  // Which staff perform this service. Optional so an edit can leave the
  // assignment alone; a create treats "missing" as "nobody yet".
  assignedStaffIds: staffIds.optional(),
});
export const servicePatchSchema = serviceInputSchema.partial();

export const DEFAULT_WORKING_HOURS = "10:00 AM – 7:00 PM";

export const staffInputSchema = z.object({
  name: z.string().trim().min(1, "Enter the staff member's name").max(80),
  role: z.string().trim().min(1, "Enter a role, e.g. Senior Stylist").max(60),
  phone: z.string().trim().max(20, "Phone number is too long").optional(),
  email: z.union([z.literal(""), z.email("Enter a valid email or leave it blank")]).optional(),
  workingHours: z.string().trim().max(60).optional(),
  skills: z.array(z.string().trim().min(1).max(30)).max(20).optional(),
  commissionRate: z
    .number("Enter a commission percentage")
    .min(0, "Commission can't be negative")
    .max(100, "Commission can't be more than 100%")
    .optional(),
  status: z.enum(["ACTIVE", "ON_LEAVE"]).optional(),
  // Which services this person performs (same join table as
  // Service.assignedStaffIds, edited from the other side).
  serviceIds: serviceIds.optional(),
});
export const staffPatchSchema = staffInputSchema.partial();

export function uniq(ids: string[] | undefined): string[] {
  return [...new Set(ids ?? [])];
}

export function isForeignKeyError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003";
}

/** [start of this month, start of next month) as dates comparable to @db.Date columns. */
export function monthRange(now = new Date()): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  };
}

// --- shapes sent to the dashboard ---

export function toServiceDto(
  s: { id: string; name: string; category: string; durationMinutes: number; price: Prisma.Decimal | number },
  assignedStaffIds: string[]
) {
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    durationMinutes: s.durationMinutes,
    price: Number(s.price),
    assignedStaffIds,
  };
}

export function toStaffDto(
  s: {
    id: string;
    name: string;
    role: string;
    phone: string;
    email: string;
    workingHours: string;
    skills: string[];
    rating: number;
    commissionRate: number;
    status: "ACTIVE" | "ON_LEAVE";
  },
  assignedServiceIds: string[],
  bookingsThisMonth = 0,
  revenueGenerated = 0
) {
  return {
    id: s.id,
    name: s.name,
    role: s.role,
    phone: s.phone,
    email: s.email,
    workingHours: s.workingHours,
    skills: s.skills,
    rating: s.rating,
    commissionRate: s.commissionRate,
    status: s.status,
    avatarColor: colorFromId(s.id),
    assignedServiceIds,
    bookingsThisMonth,
    revenueGenerated,
  };
}
