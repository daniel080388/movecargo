import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import crypto from 'crypto';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal }); else dotenv.config();

async function sendTo(target) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set in environment or .env.local');
    process.exit(1);
  }

  const event = {
    id: `evt_auto_${Date.now()}`,
    object: 'event',
    api_version: '2022-11-15',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `sub_auto_${Date.now()}`,
        object: 'subscription',
        customer: 'cus_auto_123',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        items: { data: [{ price: { id: 'price_auto_123' } }] },
      },
    },
    livemode: false,
    type: 'customer.subscription.created',
  };

  const payload = JSON.stringify(event);
  const ts = Math.floor(Date.now() / 1000);
  const signedPayload = `${ts}.${payload}`;
  const sig = crypto.createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');
  const header = `t=${ts},v1=${sig}`;

  console.log(`Sending to ${target}`);
  try {
    const res = await fetch(target, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': header,
      },
      timeout: 10000,
    });

    const text = await res.text();
    console.log(`Response from ${target}: ${res.status}`);
    console.log(text);
    return { ok: true, status: res.status, body: text };
  } catch (err) {
    console.error(`Error sending to ${target}:`, err.message || err);
    return { ok: false, error: err };
  }
}

(async function main() {
  const ports = process.env.WEBHOOK_PORTS ? process.env.WEBHOOK_PORTS.split(',').map(p=>p.trim()) : ['3000','3001'];
  for (const port of ports) {
    const url = process.env.WEBHOOK_URL || `http://localhost:${port}/api/payments/webhook`;
    const result = await sendTo(url);
    if (result.ok) {
      console.log('Succeeded, stopping attempts.');
      process.exit(0);
    }
  }
  console.error('All attempts failed.');
  process.exit(1);
})();
