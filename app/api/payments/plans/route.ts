import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET() {
  try {
    // Try the typed client first (if prisma client was generated with Plan model)
    // Otherwise fall back to a raw SQL read from the Plan table.
    let plans: any[] = [];

    try {
      // @ts-ignore - runtime guard if prisma client isn't regenerated
      plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { priceCents: 'asc' } });
    } catch (e) {
      // Fallback: raw SQL
      const rows: any = await prisma.$queryRaw`SELECT id, name, description, "priceCents", currency, "stripeId", active FROM "Plan" WHERE active = true ORDER BY "priceCents" ASC`;
      plans = Array.isArray(rows) ? rows : [];
    }

    return NextResponse.json({ plans });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
