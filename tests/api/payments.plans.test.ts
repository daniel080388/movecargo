import { GET as plansGET } from '@/app/api/payments/plans/route'
import prisma from '@/lib/prisma'

describe('payments plans route', () => {
  beforeEach(() => {
    ;(prisma.plan.findMany as jest.Mock | undefined)?.mockReset?.()
    ;(prisma.$queryRaw as jest.Mock).mockReset()
  })

  it('returns active plans from prisma client', async () => {
    ;(prisma.plan.findMany as any) = jest.fn().mockResolvedValue([
      { id: 1, name: 'Basic', priceCents: 9900, currency: 'USD', stripeId: 'price_basic', active: true },
    ])
    const res = await plansGET()
    const json = await (res as any).json()
    expect(res.status).toBe(200)
    expect(json.plans).toHaveLength(1)
    expect(json.plans[0].name).toBe('Basic')
  })

  it('falls back to raw query when prisma client fails', async () => {
    ;(prisma.plan.findMany as any) = jest.fn().mockRejectedValue(new Error('not generated'))
    ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([
      { id: 2, name: 'Pro', priceCents: 19900, currency: 'USD', stripeId: 'price_pro', active: true },
    ])
    const res = await plansGET()
    const json = await (res as any).json()
    expect(res.status).toBe(200)
    expect(json.plans[0].name).toBe('Pro')
  })

  it('returns empty array when no plans', async () => {
    ;(prisma.plan.findMany as any) = jest.fn().mockResolvedValue([])
    const res = await plansGET()
    const json = await (res as any).json()
    expect(json.plans).toEqual([])
  })
})
