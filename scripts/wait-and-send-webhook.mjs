import 'dotenv/config'
import fetch from 'node-fetch'
import crypto from 'crypto'

// Resolve candidate bases (ports) if PROBE_URL/WEBHOOK_URL are not set
const candidatePorts = [
  ...(process.env.CANDIDATE_PORTS ? process.env.CANDIDATE_PORTS.split(',').map(s=>s.trim()) : []),
  process.env.PORT,
  '3000',
  '3001',
].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i)

let target = process.env.WEBHOOK_URL || ''
let probe = process.env.PROBE_URL || ''
const secret = process.env.STRIPE_WEBHOOK_SECRET
if (!secret) {
  console.error('STRIPE_WEBHOOK_SECRET not set. Add it to .env.local')
  process.exit(1)
}

async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)) }

async function waitForServer(timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const bases = []
    if (probe) {
      try {
        const r = await fetch(probe, { method: 'GET' })
        if (r.ok) return { base: new URL(probe).origin }
      } catch {}
      // also try the origin root
      try {
        const base = new URL(probe).origin
        const r0 = await fetch(`${base}/api/payments/webhook/test`, { method: 'GET' })
        if (r0.ok) return { base }
        const r1 = await fetch(base, { method: 'GET' })
        if (r1.ok) return { base }
      } catch {}
    } else {
      for (const port of candidatePorts) {
        const base = `http://localhost:${port}`
        bases.push(base)
        try {
          const r = await fetch(`${base}/api/health`, { method: 'GET' })
          if (r.ok) return { base }
        } catch {}
        try {
          const r2 = await fetch(`${base}/api/payments/webhook/test`, { method: 'GET' })
          if (r2.ok) return { base }
        } catch {}
        try {
          const r3 = await fetch(base, { method: 'GET' })
          if (r3.ok) return { base }
        } catch {}
      }
    }
    process.stdout.write('.')
    await sleep(1000)
  }
  return null
}

function buildSignedHeader(payload) {
  const ts = Math.floor(Date.now()/1000)
  const signed = `${ts}.${payload}`
  const sig = crypto.createHmac('sha256', secret).update(signed).digest('hex')
  return `t=${ts},v1=${sig}`
}

async function main(){
  const waitLabel = probe || `candidates: ${candidatePorts.join(',')}`
  console.log('Waiting for dev server:', waitLabel)
  const found = await waitForServer()
  if (!found) {
    console.error('\nServer did not become ready within 60s.')
    process.exit(1)
  }
  const base = found.base
  if (!target) target = `${base}/api/payments/webhook`
  console.log('\nServer is ready at', base, 'Sending webhook to', target)

  const event = {
    id: `evt_ready_${Date.now()}`,
    object: 'event',
    type: 'customer.subscription.created',
    data: { object: {
      id: `sub_ready_${Date.now()}`,
      object: 'subscription',
      customer_email: 'empresaA@example.com',
      status: 'active',
      current_period_end: Math.floor(Date.now()/1000) + 3600,
      items: { data: [{ price: { id: 'price_basic_test' } }] }
    }},
  }
  const payload = JSON.stringify(event)
  const header = buildSignedHeader(payload)

  try {
    const res = await fetch(target, { method: 'POST', body: payload, headers: { 'Content-Type':'application/json', 'Stripe-Signature': header } })
    const text = await res.text()
    console.log('Webhook response:', res.status, text)
    process.exit(res.ok ? 0 : 1)
  } catch (e) {
    console.error('Failed to send webhook:', e.message || e)
    process.exit(1)
  }
}

main()
