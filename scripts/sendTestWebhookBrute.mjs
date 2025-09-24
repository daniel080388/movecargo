import 'dotenv/config';
import fetch from 'node-fetch';
import crypto from 'crypto';

const secret = process.env.STRIPE_WEBHOOK_SECRET;
if (!secret) {
  console.error('STRIPE_WEBHOOK_SECRET not defined in .env.local or environment');
  process.exit(1);
}

function makeEvent() {
  const event = {
    id: `evt_brute_${Date.now()}`,
    object: 'event',
    api_version: '2022-11-15',
    created: Math.floor(Date.now() / 1000),
    data: { object: { id: `sub_brute_${Date.now()}`, object: 'subscription', customer: 'cus_brute', status: 'active', current_period_end: Math.floor(Date.now()/1000)+86400 } },
    livemode: false,
    type: 'customer.subscription.created',
  };
  return JSON.stringify(event);
}

async function trySend(url) {
  const payload = makeEvent();
  const ts = Math.floor(Date.now() / 1000);
  const signed = `${ts}.${payload}`;
  const sig = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  const header = `t=${ts},v1=${sig}`;
  try {
    const res = await fetch(url, { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json', 'Stripe-Signature': header }, timeout: 5000 });
    const text = await res.text();
    return { ok: true, status: res.status, body: text };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

(async () => {
  const hosts = ['localhost','127.0.0.1'];
  const ports = Array.from({length:11}, (_,i)=>3000+i);
  for (const host of hosts) {
    for (const port of ports) {
      const url = `http://${host}:${port}/api/payments/webhook`;
      process.stdout.write(`Trying ${url} ... `);
      const r = await trySend(url);
      if (r.ok) {
        console.log(`SUCCESS ${r.status}`);
        console.log(r.body);
        process.exit(0);
      } else {
        console.log(`FAIL: ${r.error}`);
      }
    }
  }
  console.error('No endpoints responded in tested range.');
  process.exit(1);
})();
