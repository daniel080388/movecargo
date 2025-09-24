/**
 * @jest-environment node
 */
import { GET as empresaCargasGET } from '@/app/api/empresa/cargas/route'
import { signToken } from '@/lib/auth'
import prisma from '@/lib/prisma'

describe('/api/empresa/cargas auth', () => {
  beforeEach(() => {
    ;(prisma.carga.findMany as jest.Mock).mockResolvedValue([])
  })

  function makeReq(authHeader?: string): Request {
    return { headers: { get: (k: string) => (k.toLowerCase() === 'authorization' ? (authHeader || null) : null) } } as any
  }

  it('sem header -> 401', async () => {
    const res: any = await empresaCargasGET(makeReq())
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toMatch(/Não autorizado|Unauthorized/i)
  })

  it('JWT inválido -> 401', async () => {
    const res: any = await empresaCargasGET(makeReq('Bearer invalid.token'))
    expect(res.status).toBe(401)
  })

  it('JWT válido mas role errada -> 403', async () => {
    const token = signToken({ uid: 10, role: 'motorista' })
    const res: any = await empresaCargasGET(makeReq(`Bearer ${token}`))
    expect(res.status).toBe(403)
  })

  it('JWT válido role empresa -> 200', async () => {
    const token = signToken({ uid: 1, role: 'empresa' })
    const res: any = await empresaCargasGET(makeReq(`Bearer ${token}`))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
  })
})
