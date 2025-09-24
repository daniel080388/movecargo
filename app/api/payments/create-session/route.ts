import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not defined');
  return new Stripe(key);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
  const { priceId, successUrl, cancelUrl } = body;
  if (!priceId) return NextResponse.json({ error: 'priceId is required' }, { status: 400 });

    // Map priceId -> local Plan (if exists)
    let plan = null;
    if (priceId) {
      try {
        plan = await prisma.plan.findUnique({ where: { stripeId: priceId } });
      } catch (e) {
        // runtime guard if prisma client not up-to-date
        console.warn('Could not lookup plan for priceId', priceId, e);
      }
    }

    // Identify an authenticated user and create/attach a Stripe Customer
    const maybeUser = getUserFromRequest(req);
    let customerId: string | undefined;

    let stripe: Stripe;
    try {
      stripe = getStripe();
    } catch (e: any) {
      console.error('Stripe init error', e?.message || e);
      return NextResponse.json({ error: 'Stripe not configured on server' }, { status: 500 });
    }

    if (maybeUser) {
      try {
        const user = await prisma.user.findUnique({ where: { id: maybeUser.uid } });
        if (user?.stripeCustomerId) {
          customerId = user.stripeCustomerId;
        } else {
          const customer = await stripe.customers.create({
            email: user?.email || undefined,
            metadata: { userId: String(maybeUser.uid) },
          });
          customerId = customer.id;
          // persist stripeCustomerId with runtime guard
          try {
            await prisma.user.update({ where: { id: maybeUser.uid }, data: { stripeCustomerId: customerId } });
          } catch (e) {
            try {
              await prisma.$executeRaw`UPDATE "User" SET "stripeCustomerId" = ${customerId} WHERE id = ${maybeUser.uid}`;
            } catch (_err) {
              console.error("Failed to persist stripeCustomerId", _err);
            }
          }
        }
      } catch (e) {
        console.error("Error fetching user for stripe customer creation", e);
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId as string, quantity: 1 }],
      success_url: (successUrl as string) || `${baseUrl}/empresa/billing/success`,
      cancel_url: (cancelUrl as string) || `${baseUrl}/empresa/billing/cancel`,
      customer: customerId,
      metadata: {
        // Stripe metadata values should be strings or null
        planId: plan ? String(plan.id) : null as any,
      } as any,
    };

    const session = await stripe.checkout.sessions.create(params);

    // Return plan info to help client-side UX
    return NextResponse.json({ sessionId: session.id, sessionUrl: session.url, planId: plan?.id ?? null });
  } catch (err: any) {
    console.error("create-session error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
