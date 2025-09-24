/**
 * @jest-environment node
 */
import { POST as createByCarga } from '@/app/api/cargas/[id]/propostas/route'
import prisma from '@/lib/prisma'
import { signToken } from '@/lib/auth'

function makeReq(body: any, authHeader?: string): Request {
  return {
    json: async () => body,
    headers: { get: (k: string) => (k.toLowerCase() === 'authorization' ? (authHeader || null) : null) },
  } as any
}

function makeCtx(id: string) {
  return { params: { id } } as any
}

describe('POST /api/cargas/[id]/propostas', () => {
  const token = signToken({ uid: 3, role: 'TRANSPORTADORA' })

  beforeEach(() => {
    ;(prisma.proposta.create as jest.Mock) = jest.fn().mockResolvedValue({ id: 10, cargaId: 7, valor: 900, mensagem: 'ok' })
  })

  it('401 sem token/role', async () => {
    const res: any = await createByCarga(makeReq({ valor: 1000 }), makeCtx('7'))
    expect(res.status).toBe(401)
  })

  it('400 id invalido', async () => {
    const res: any = await createByCarga(makeReq({ valor: 1000 }, `Bearer ${token}`), makeCtx('abc'))
    expect(res.status).toBe(400)
  })

  it('400 valor invalido', async () => {
    const res: any = await createByCarga(makeReq({ valor: -5 }, `Bearer ${token}`), makeCtx('7'))
    expect(res.status).toBe(400)
  })

  it('201 cria proposta', async () => {
    const res: any = await createByCarga(makeReq({ valor: 900, mensagem: 'ok' }, `Bearer ${token}`), makeCtx('7'))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body?.proposta?.id).toBe(10)
  })
})
