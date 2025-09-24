// set temp processed file path before importing route
const os = require('os')
const tmpProcessed = require('path').join(os.tmpdir(), `stripe-processed-${Date.now()}.json`)
;(process as any).env.STRIPE_PROCESSED_FILE = tmpProcessed
import { POST as webhookPOST } from '@/app/api/payments/webhook/route'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

// prisma mock comes from jest.setup.js
import prisma from '@/lib/prisma'

function signPayload(payload: string, secret: string, timestamp?: number) {
  const t = timestamp ?? Math.floor(Date.now() / 1000)
  const signed = `${t}.${payload}`
  const v1 = crypto.createHmac('sha256', secret).update(signed).digest('hex')
  return `t=${t},v1=${v1}`
}

describe('payments webhook route', () => {
  const secret = 'whsec_test'
  const headers = new Map<string, string>() as any

  beforeEach(() => {
    ;(process as any).env.STRIPE_WEBHOOK_SECRET = secret
    ;(prisma.subscription.updateMany as jest.Mock).mockReset().mockResolvedValue({ count: 0 })
    ;(prisma.subscription.create as jest.Mock).mockReset().mockResolvedValue({})
    ;(prisma.plan.findUnique as jest.Mock).mockReset().mockResolvedValue({ id: 1 })
    ;(prisma.user.findFirst as jest.Mock).mockReset().mockResolvedValue({ id: 123 })
    // ensure processed file is clean
    try { if (fs.existsSync(tmpProcessed)) fs.unlinkSync(tmpProcessed) } catch {}
    // silence noisy logs
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('accepts valid signature and creates subscription', async () => {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_1',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 3600,
          customer: 'cus_123',
          items: { data: [{ price: { id: 'price_basic' } }] },
        },
      },
    }
    const payload = JSON.stringify(event)
    const sig = signPayload(payload, secret)

    const req = {
      text: async () => payload,
      headers: { get: (k: string) => (k.toLowerCase() === 'stripe-signature' ? sig : null) },
    } as any

    const res = await webhookPOST(req)
    const json = await (res as any).json()
    expect(res.status).toBe(200)
    expect(json.received).toBe(true)
    expect(prisma.subscription.create).toHaveBeenCalled()
  })

  it('rejects invalid signature', async () => {
    const payload = JSON.stringify({ id: 'evt_2', type: 'test' })
    const sig = 't=1,v1=badsign'
    const req = { text: async () => payload, headers: { get: () => sig } } as any
    const res = await webhookPOST(req)
    expect(res.status).toBe(400)
  })

  it('is idempotent (already processed)', async () => {
    // First call processes normally
    const event = { id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`, type: 'customer.subscription.updated', data: { object: { id: 'sub_3', status: 'active', current_period_end: Math.floor(Date.now()/1000) + 10, customer: 'cus_999', items: { data: [{ price: { id: 'price_basic' } }] } } } }
    const payload = JSON.stringify(event)
    const sig = signPayload(payload, secret)

    const req = { text: async () => payload, headers: { get: (k: string) => (k.toLowerCase() === 'stripe-signature' ? sig : null) } } as any

    const res1 = await webhookPOST(req)
    expect(res1.status).toBe(200)

    // Second call with same payload should be treated as already processed
    const res2 = await webhookPOST(req)
    const json2 = await (res2 as any).json()
    expect(res2.status).toBe(200)
    expect(json2.note).toBe('already processed')
  })
})
