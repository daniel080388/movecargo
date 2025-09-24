/**
 * @jest-environment node
 */
import { GET as motoristaGET } from '@/app/api/transportadora/propostas/route'
import prisma from '@/lib/prisma'
import { signToken } from '@/lib/auth'

function makeReq(authHeader?: string): Request {
  return { headers: { get: (k: string) => (k.toLowerCase() === 'authorization' ? (authHeader || null) : null) } } as any
}

describe('GET /api/transportadora/propostas', () => {
  beforeEach(() => {
    ;(prisma.proposta.findMany as jest.Mock).mockReset()
  })

  it('401 sem token', async () => {
    const res: any = await motoristaGET(makeReq())
    expect(res.status).toBe(401)
  })

  it('401 role incorreta', async () => {
    const token = signToken({ uid: 1, role: 'empresa' })
    const res: any = await motoristaGET(makeReq(`Bearer ${token}`))
    expect(res.status).toBe(401)
  })

  it('200 com token de MOTORISTA', async () => {
    const token = signToken({ uid: 7, role: 'MOTORISTA' })
    ;(prisma.proposta.findMany as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }])
    const res: any = await motoristaGET(makeReq(`Bearer ${token}`))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })
})
