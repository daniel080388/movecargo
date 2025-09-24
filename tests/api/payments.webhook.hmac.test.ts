/**
 * @jest-environment node
 */
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Import the real webhook route (not the local test one)
import { POST as webhookPOST } from '@/app/api/payments/webhook/route'

function makeSig(payload: string, secret: string) {
  const t = Math.floor(Date.now() / 1000)
  const signedPayload = `${t}.${payload}`
  const v1 = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')
  return `t=${t},v1=${v1}`
}

describe('/api/payments/webhook HMAC & idempotency', () => {
  const prevSecret = process.env.STRIPE_WEBHOOK_SECRET
  const prevFile = process.env.STRIPE_PROCESSED_FILE
  const SECRET = 'whsec_test_123'
  const tmpFile = path.join(os.tmpdir(), `stripe-processed-${Date.now()}.json`)

  beforeAll(() => {
    process.env.STRIPE_WEBHOOK_SECRET = SECRET
    process.env.STRIPE_PROCESSED_FILE = tmpFile
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile) } catch {}
  })

  afterAll(() => {
    if (prevSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET
    else process.env.STRIPE_WEBHOOK_SECRET = prevSecret
    if (prevFile === undefined) delete process.env.STRIPE_PROCESSED_FILE
    else process.env.STRIPE_PROCESSED_FILE = prevFile
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile) } catch {}
  })

  it('rejects when signature is missing', async () => {
    const evt = { id: 'evt_1', type: 'customer.subscription.created', data: { object: { id: 'sub_1', status: 'active' } } }
    const payload = JSON.stringify(evt)
    const req: any = { text: async () => payload, headers: new Map() }
    req.headers.get = (k: string) => null
    const res: any = await webhookPOST(req)
    expect(res.status).toBe(400)
    const j = await res.json()
    expect(j.error).toContain('Signature verification failed')
  })

  it('rejects when signature is invalid', async () => {
    const evt = { id: 'evt_2', type: 'customer.subscription.created', data: { object: { id: 'sub_2', status: 'active' } } }
    const payload = JSON.stringify(evt)
    const req: any = { text: async () => payload, headers: new Map() }
    req.headers.get = (k: string) => k === 'stripe-signature' ? 't=123,v1=deadbeef' : null
    const res: any = await webhookPOST(req)
    expect(res.status).toBe(400)
    const j = await res.json()
    expect(j.error).toBe('Invalid signature')
  })

  it('accepts valid signature and is idempotent', async () => {
    const evt = { id: 'evt_uniq', type: 'customer.subscription.created', data: { object: { id: 'sub_X', status: 'active' } } }
    const payload = JSON.stringify(evt)
    const sig = makeSig(payload, SECRET)
    const req1: any = { text: async () => payload, headers: new Map() }
    req1.headers.get = (k: string) => k === 'stripe-signature' ? sig : null
    const res1: any = await webhookPOST(req1)
    expect(res1.status).toBe(200)
    const j1 = await res1.json()
    expect(j1.received).toBe(true)

    // second time same id -> should be idempotent (already processed)
    const req2: any = { text: async () => payload, headers: new Map() }
    req2.headers.get = (k: string) => k === 'stripe-signature' ? sig : null
    const res2: any = await webhookPOST(req2)
    expect(res2.status).toBe(200)
    const j2 = await res2.json()
    expect(j2.note).toBe('already processed')
  })
})
