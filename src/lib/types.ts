export type Role = "OWNER" | "RECEPTIONIST" | "STYLIST" | "CUSTOMER";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "PAID" | "PENDING" | "PARTIAL";

export type PaymentMethod = "CASH" | "UPI" | "CREDIT_CARD" | "DEBIT_CARD";

export interface Staff {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  phone: string;
  email: string;
  workingHours: string;
  skills: string[];
  rating: number;
  utilization: number; // 0-100
  revenueGenerated: number;
  commissionRate: number; // percent
  status: "ACTIVE" | "ON_LEAVE";
}

// A staff row as returned by GET /api/staff: the salon's real team, with
// this month's numbers computed from its actual appointments. (`Staff`
// above is the older shape the sample data and some charts still use.)
export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  workingHours: string;
  skills: string[];
  rating: number;
  commissionRate: number; // percent
  status: "ACTIVE" | "ON_LEAVE";
  avatarColor: string;
  assignedServiceIds: string[];
  bookingsThisMonth: number; // not cancelled
  revenueGenerated: number; // completed appointments this month
}

export interface Service {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  assignedStaffIds: string[];
}

// Deliberately smaller than Staff/Service above — these are what the
// unauthenticated /book portal and its /api/public/* routes deal in. No
// phone, email, commissionRate, revenueGenerated, or utilization: an
// anonymous visitor has no business seeing any of that.
export interface PublicService {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
}

export interface PublicStaff {
  id: string;
  name: string;
  role: string;
  rating: number;
  skills: string[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthday: string; // MM-DD
  joinedAt: string; // ISO date
  totalVisits: number;
  totalSpend: number;
  loyaltyPoints: number;
  lastVisit: string; // ISO date
  notes: string;
  tags: ("VIP" | "New" | "Regular" | "At risk")[];
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  date: string; // ISO date (yyyy-mm-dd)
  time: string; // HH:mm
  durationMinutes: number;
  price: number;
  status: AppointmentStatus;
  notes?: string;
}

export interface InvoiceLineItem {
  serviceName: string;
  qty: number;
  price: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  emailSent: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  supplier: string;
  costPerUnit: number;
}
