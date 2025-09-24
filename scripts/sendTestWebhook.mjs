import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import crypto from 'crypto';

// Load .env.local explicitly when present
const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal }); else dotenv.config();

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  console.error('STRIPE_WEBHOOK_SECRET not set in environment. Set it in .env.local or export it.');
  process.exit(1);
}
async function main() {
  const event = {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2022-11-15',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `sub_test_${Date.now()}`,
        object: 'subscription',
        customer: 'cus_test_123',
        customer_email: 'empresaA@example.com',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        items: { data: [{ price: { id: 'price_basic_test' } }] },
      },
    },
    livemode: false,
    type: 'customer.subscription.created',
  };

  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);

  // Build signature per Stripe's format: t=<timestamp>,v1=<hmac>
  const signedPayload = `${timestamp}.${payload}`;
  const hmac = crypto.createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');
  const signature = `t=${timestamp},v1=${hmac}`;

  const target = process.env.WEBHOOK_URL || 'http://localhost:3000/api/payments/webhook';
  console.log('Sending test webhook event:', event.type, 'to', target);
  try {
    const res = await fetch(target, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature,
      },
    });

    const text = await res.text();
    console.log('Response status:', res.status);
    console.log('Response body:', text);
  } catch (err) {
    console.error('Request failed:', err);
    process.exitCode = 1;
  }
}

main();
