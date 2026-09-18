import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

// Adds the tenant/role fields Lustre needs onto Auth.js's Session/User/JWT
// types. Without this, `session.user.salonId` etc. don't type-check.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      salonId: string | null;
      salonName: string | null;
      staffId: string | null;
      customerId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    salonId: string | null;
    salonName?: string | null;
    staffId?: string | null;
    customerId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    salonId: string | null;
    salonName: string | null;
    staffId?: string | null;
    customerId?: string | null;
  }
}
