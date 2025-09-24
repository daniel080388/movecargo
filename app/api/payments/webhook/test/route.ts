import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '../../../../../lib/prisma';

const PROCESSED_FILE = path.resolve(process.cwd(), 'data', 'stripe-processed-events.json');

function ensureProcessedFile() {
  const dir = path.dirname(PROCESSED_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(PROCESSED_FILE)) fs.writeFileSync(PROCESSED_FILE, JSON.stringify([]));
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const eventId = body.id || `evt_local_${Date.now()}`;

    // mark processed
    markProcessed(eventId);

    // minimal subscription persistence: if payload contains stripeSubId, try create
    try {
      const sub = body.data?.object || {};
      const stripeSubId = sub.id || null;
      const status = sub.status || 'active';
      const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

      if (stripeSubId) {
        // upsert-like behavior
        const updated = await prisma.subscription.updateMany({ where: { stripeSubId }, data: { status, currentPeriodEnd } }).catch(() => ({ count: 0 }));
        if (updated && updated.count === 0) {
          const createData: any = { stripeSubId, status, currentPeriodEnd };
          await prisma.subscription.create({ data: createData }).catch(() => null);
        }
      }
    } catch (e) {
      console.warn('Local webhook: failed to persist subscription', e);
    }

    return NextResponse.json({ received: true, id: eventId });
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid payload', details: String(err) }, { status: 400 });
  }
}

export async function GET() {
  try {
    ensureProcessedFile();
    const content = fs.readFileSync(PROCESSED_FILE, 'utf8') || '[]';
    const ids = JSON.parse(content) as string[];
    return NextResponse.json({ ok: true, processedCount: ids.length, last: ids[ids.length-1] || null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
