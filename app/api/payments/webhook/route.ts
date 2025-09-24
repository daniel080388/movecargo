import { NextResponse } from "next/server";
import crypto from 'crypto';
import prisma from "@/lib/prisma";
import fs from 'fs';
import path from 'path';

const USE_DB_IDEMPOTENCY = process.env.USE_DB_IDEMPOTENCY === 'true';
const PROCESSED_FILE = process.env.STRIPE_PROCESSED_FILE
  ? path.resolve(process.env.STRIPE_PROCESSED_FILE)
  : path.resolve(process.cwd(), 'data', 'stripe-processed-events.json');

function verifyStripeSignature(payload: string, sigHeader: string | null, secret: string | undefined) {
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
  if (!sigHeader) throw new Error('Missing stripe-signature header');

  // header format: t=timestamp,v1=signature[,v1=...]
  const parts = sigHeader.split(',').reduce((acc: any, part: string) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {});
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) throw new Error('Invalid stripe-signature header');

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

  // timing-safe compare
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(v1, 'hex');
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

function ensureProcessedFile() {
  const dir = path.dirname(PROCESSED_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(PROCESSED_FILE)) fs.writeFileSync(PROCESSED_FILE, JSON.stringify([]));
}

function hasProcessed(id: string) {
  ensureProcessedFile();
  const content = fs.readFileSync(PROCESSED_FILE, 'utf8') || '[]';
  const arr = JSON.parse(content) as string[];
  return arr.includes(id);
}

function markProcessed(id: string) {
  ensureProcessedFile();
  const content = fs.readFileSync(PROCESSED_FILE, 'utf8') || '[]';
  const arr = JSON.parse(content) as string[];
  if (!arr.includes(id)) {
    arr.push(id);
    fs.writeFileSync(PROCESSED_FILE, JSON.stringify(arr, null, 2));
  }
}

// Optional: DB-backed idempotency for serverless runtimes
async function ensureProcessedTable() {
  // Postgres: create table if not exists with unique constraint on eventId
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "StripeProcessedEvent" (
      id SERIAL PRIMARY KEY,
      "eventId" TEXT UNIQUE NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
}

async function hasProcessedDb(id: string) {
  await ensureProcessedTable();
  const rows = await prisma.$queryRaw<any[]>`SELECT 1 as one FROM "StripeProcessedEvent" WHERE "eventId" = ${id} LIMIT 1`;
  return rows.length > 0;
}

async function markProcessedDb(id: string) {
  await ensureProcessedTable();
  // ON CONFLICT DO NOTHING to keep idempotent
  await prisma.$executeRaw`INSERT INTO "StripeProcessedEvent" ("eventId") VALUES (${id}) ON CONFLICT ("eventId") DO NOTHING`;
}

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = (req as any).headers.get("stripe-signature");

  try {
    // Verify signature using webhook secret (manual HMAC) so webhook can be tested without STRIPE_SECRET_KEY
    try {
      const ok = verifyStripeSignature(payload, sig || null, process.env.STRIPE_WEBHOOK_SECRET);
      if (!ok) {
        console.warn('Invalid stripe signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } catch (e: any) {
      console.error('Signature verification failed', e?.message || e);
      return NextResponse.json({ error: 'Signature verification failed', details: String(e) }, { status: 400 });
    }

    const event = JSON.parse(payload) as any;
    if (USE_DB_IDEMPOTENCY) {
      if (await hasProcessedDb(event.id)) {
        return NextResponse.json({ received: true, note: 'already processed (db)' });
      }
    } else {
      if (hasProcessed(event.id)) {
        return NextResponse.json({ received: true, note: 'already processed' });
      }
    }

    console.log('Stripe event', event.type);

    // Helper to find user by stripeCustomerId or by email
    const findUserIdForCustomer = async (stripeCustomerId?: string, email?: string) => {
      try {
        if (stripeCustomerId) {
          // stripeCustomerId may not be unique in types, use findFirst safely
          const u = await prisma.user.findFirst({ where: { stripeCustomerId } });
          if (u) return u.id;
        }
        if (email) {
          const u2 = await prisma.user.findUnique({ where: { email } });
          if (u2) return u2.id;
        }
      } catch (e) {
        console.warn('User lookup failed', e);
      }
      return null;
    };

    // Handle subscription lifecycle events
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const sub = event.data.object as any;
      const stripeSubId = sub.id;
      const status = sub.status;
      const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
      const stripeCustomerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;

      // Try to map plan from subscription items or metadata
      let planId: number | null = null;
      try {
        const priceId = sub.items?.data?.[0]?.price?.id || sub.items?.data?.[0]?.price || sub.metadata?.priceId || null;
        if (priceId) {
          const plan = await prisma.plan.findUnique({ where: { stripeId: priceId } });
          if (plan) planId = plan.id;
        }
      } catch (e) {
        console.warn('Plan mapping failed', e);
      }

      const userId = await findUserIdForCustomer(stripeCustomerId, sub.customer_email || sub.billing_details?.email || null);

      try {
      const updateData: { status: string; currentPeriodEnd: Date | null; userId?: number; planId?: number } = { status, currentPeriodEnd };
      if (userId != null) updateData.userId = userId;
      if (planId != null) updateData.planId = planId;
      const updated = await prisma.subscription.updateMany({ where: { stripeSubId }, data: updateData }).catch(() => ({ count: 0 }));
        if (updated && updated.count === 0) {
          try {
            // Use relation connect syntax when possible to satisfy Prisma types
            const createData: any = { stripeSubId, status, currentPeriodEnd };
            if (userId != null) createData.user = { connect: { id: userId } };
            if (planId != null) createData.plan = { connect: { id: planId } };
            await prisma.subscription.create({ data: createData });
          } catch (e) {
            // fallback raw insert
            try {
              await prisma.$executeRaw`INSERT INTO "Subscription" ("userId","planId","stripeSubId","status","currentPeriodEnd","createdAt","updatedAt") VALUES (${userId}, ${planId}, ${stripeSubId}, ${status}, ${currentPeriodEnd}, now(), now())`;
            } catch (e2) {
              console.warn('Fallback insert subscription failed:', e2);
            }
          }
        }
      } catch (e) {
        console.warn('Prisma update subscription failed, skipping:', e);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as any;
      const stripeSubId = sub.id;
      try {
        await prisma.subscription.updateMany({ where: { stripeSubId }, data: { status: 'canceled' } }).catch(() => null);
      } catch (e) {
        console.warn('Prisma update subscription failed:', e);
      }
    }

    if (USE_DB_IDEMPOTENCY) {
      await markProcessedDb(event.id);
    } else {
      markProcessed(event.id);
    }
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error', err);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}
