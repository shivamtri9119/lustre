import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireSalonSession } from "@/lib/session-guard";
import { ensureSalonSlug, validateSlug } from "@/lib/slug";

// The signed-in salon's public booking link. Owners and receptionists can
// read it (so they can share it); only the owner can change it.

export async function GET() {
  try {
    const { salonId } = await requireSalonSession(["OWNER", "RECEPTIONIST"]);
    // Salons created before slugs existed get theirs on first read.
    const slug = await ensureSalonSlug(prisma, salonId);
    return NextResponse.json({ slug });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z.object({ slug: z.string().trim().toLowerCase() });

export async function PATCH(req: Request) {
  try {
    const { salonId } = await requireSalonSession(["OWNER"]);

    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a link name" }, { status: 400 });
    }
    const { slug } = parsed.data;

    const problem = validateSlug(slug);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });

    try {
      await prisma.salon.update({ where: { id: salonId }, data: { slug } });
    } catch (err) {
      // P2002 = unique constraint: another salon already has this link.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.json({ error: "That link is already taken. Try another." }, { status: 409 });
      }
      throw err;
    }
    return NextResponse.json({ slug });
  } catch (err) {
    return handleApiError(err);
  }
}
