import prisma from '@/lib/prisma'
let chatPOST: (req: Request) => Promise<any>

function makeReq(body: any, headers?: Record<string,string>) {
  return {
    json: async () => body,
    headers: { get: (k: string) => headers?.[k.toLowerCase()] || null },
  } as any
}

describe('support chat rate-limit', () => {
  beforeEach(() => {
    ;(process as any).env.SUPPORT_RATE_LIMIT = '3'
    ;(process as any).env.SUPPORT_RATE_WINDOW_MS = '1000'
    ;(process as any).env.REDIS_URL = '' // ensure in-memory path in tests
    // Load route fresh with env applied
    jest.isolateModules(() => {
      const mod = require('@/app/api/support/chat/route')
      chatPOST = mod.POST
    })
    // prisma mocks noop
    ;(prisma.supportConversation.findUnique as jest.Mock).mockReset().mockResolvedValue(null)
    ;(prisma.supportConversation.create as jest.Mock).mockReset().mockResolvedValue({ id: 1, sessionId: 's' })
    ;(prisma.supportMessage.create as jest.Mock).mockReset().mockResolvedValue({})
  })

  it('returns 429 when exceeding limit per window', async () => {
    const ip = '1.1.1.1'
    const headers = { 'x-forwarded-for': ip }
    const req = (msg: string) => makeReq({ message: msg }, headers)

    const r1 = await chatPOST(req('a'))
    const r2 = await chatPOST(req('b'))
    const r3 = await chatPOST(req('c'))
    const r4 = await chatPOST(req('d'))

    expect(r1.status).toBeLessThan(429)
    expect(r2.status).toBeLessThan(429)
    expect(r3.status).toBeLessThan(429)
    expect(r4.status).toBe(429)
  })
})
