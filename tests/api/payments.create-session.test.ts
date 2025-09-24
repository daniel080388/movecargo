import { POST as createSessionPOST } from '@/app/api/payments/create-session/route'
import prisma from '@/lib/prisma'

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: { create: jest.fn().mockResolvedValue({ id: 'cus_mock' }) },
    checkout: { sessions: { create: jest.fn().mockResolvedValue({ id: 'cs_test', url: 'https://stripe.session/mock' }) } },
  }))
})

describe('payments create-session route', () => {
  beforeEach(() => {
    ;(prisma.user.findUnique as jest.Mock).mockReset().mockResolvedValue({ id: 123, email: 'user@example.com' })
    ;(prisma.user.update as jest.Mock).mockReset().mockResolvedValue({})
    ;(prisma.plan.findUnique as jest.Mock).mockReset().mockResolvedValue({ id: 1 })
  })

  it('returns 500 when STRIPE_SECRET_KEY is missing', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    delete (process as any).env.STRIPE_SECRET_KEY
    const req = { json: async () => ({ priceId: 'price_basic' }), headers: { get: () => null } } as any
    const res = await createSessionPOST(req)
    const json = await (res as any).json()
    expect(res.status).toBe(500)
    expect(json.error).toContain('Stripe not configured')
    spy.mockRestore()
  })

  it('creates a session with valid key', async () => {
    ;(process as any).env.STRIPE_SECRET_KEY = 'sk_test_123'
    // Mock an auth header with Bearer token for getUserFromRequest
    const token = 'dummy' // our getUserFromRequest will attempt to verify; SECRET uses default and jwt.verify will throw unless we mock

    // Simplify: call without auth, route handles maybeUser null and still creates session
    const req = { json: async () => ({ priceId: 'price_basic' }), headers: { get: () => null } } as any
    const res = await createSessionPOST(req)
    const json = await (res as any).json()
    expect(res.status).toBe(200)
    expect(json.sessionUrl).toBeTruthy()
  })
})
