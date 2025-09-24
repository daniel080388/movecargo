/**
 * @jest-environment node
 */
import { POST as aceitarPOST } from '@/app/api/propostas/[id]/aceitar/route'
import { POST as recusarPOST } from '@/app/api/propostas/[id]/recusar/route'
import prisma from '@/lib/prisma'
import { signToken } from '@/lib/auth'

function makeCtx(id: string) {
  return { params: { id } } as any
}

function makeReq(authHeader?: string): Request {
  return { headers: { get: (k: string) => (k.toLowerCase() === 'authorization' ? (authHeader || null) : null) } } as any
}

describe('Propostas aceitar/recusar', () => {
  const empresaToken = signToken({ uid: 1, role: 'empresa' })

  beforeEach(() => {
    ;(prisma.proposta.findUnique as jest.Mock).mockReset()
    ;(prisma.$transaction as any) = jest.fn().mockResolvedValue(true)
    ;(prisma.proposta.updateMany as jest.Mock) = jest.fn().mockResolvedValue({ count: 0 })
    ;(prisma.proposta.update as jest.Mock) = jest.fn().mockResolvedValue({})
  })

  it('aceitar: 401 sem token/role', async () => {
    const res: any = await aceitarPOST(makeReq(), makeCtx('1'))
    expect(res.status).toBe(401)
  })

  it('aceitar: 400 id inválido', async () => {
    const res: any = await aceitarPOST(makeReq(`Bearer ${empresaToken}`), makeCtx('abc'))
    expect(res.status).toBe(400)
  })

  it('aceitar: 404 proposta não encontrada', async () => {
    ;(prisma.proposta.findUnique as jest.Mock).mockResolvedValue(null)
    const res: any = await aceitarPOST(makeReq(`Bearer ${empresaToken}`), makeCtx('99'))
    expect(res.status).toBe(404)
  })

  it('aceitar: 403 empresa diferente', async () => {
    ;(prisma.proposta.findUnique as jest.Mock).mockResolvedValue({ id: 5, cargaId: 10, status: 'PENDENTE', carga: { empresaId: 999 } })
    const res: any = await aceitarPOST(makeReq(`Bearer ${empresaToken}`), makeCtx('5'))
    expect(res.status).toBe(403)
  })

  it('aceitar: 400 já processada', async () => {
    ;(prisma.proposta.findUnique as jest.Mock).mockResolvedValue({ id: 5, cargaId: 10, status: 'ACEITA', carga: { empresaId: 1 } })
    const res: any = await aceitarPOST(makeReq(`Bearer ${empresaToken}`), makeCtx('5'))
    expect(res.status).toBe(400)
  })

  it('aceitar: 200 sucesso atualiza e recusa restantes', async () => {
    ;(prisma.proposta.findUnique as jest.Mock).mockImplementation(({ where }: any) => {
      if (where.id === 5) return { id: 5, cargaId: 10, status: 'PENDENTE', carga: { empresaId: 1 } }
      return { id: 5, cargaId: 10, status: 'ACEITA', motorista: { id: 2, name: 'M', email: 'm@x' }, carga: { id: 10 } }
    })
    const res: any = await aceitarPOST(makeReq(`Bearer ${empresaToken}`), makeCtx('5'))
    expect(res.status).toBe(200)
  })

  it('recusar: 401 sem token/role', async () => {
    const res: any = await recusarPOST(makeReq(), makeCtx('1'))
    expect(res.status).toBe(401)
  })

  it('recusar: 400 id inválido', async () => {
    const res: any = await recusarPOST(makeReq(`Bearer ${empresaToken}`), makeCtx('nope'))
    expect(res.status).toBe(400)
  })

  it('recusar: 404 proposta não encontrada', async () => {
    ;(prisma.proposta.findUnique as jest.Mock).mockResolvedValue(null)
    const res: any = await recusarPOST(makeReq(`Bearer ${empresaToken}`), makeCtx('77'))
    expect(res.status).toBe(404)
  })

  it('recusar: 403 empresa diferente', async () => {
    ;(prisma.proposta.findUnique as jest.Mock).mockResolvedValue({ id: 9, cargaId: 11, status: 'PENDENTE', carga: { empresaId: 2 } })
    const res: any = await recusarPOST(makeReq(`Bearer ${empresaToken}`), makeCtx('9'))
    expect(res.status).toBe(403)
  })

  it('recusar: 400 já processada', async () => {
    ;(prisma.proposta.findUnique as jest.Mock).mockResolvedValue({ id: 9, cargaId: 11, status: 'ACEITA', carga: { empresaId: 1 } })
    const res: any = await recusarPOST(makeReq(`Bearer ${empresaToken}`), makeCtx('9'))
    expect(res.status).toBe(400)
  })

  it('recusar: 200 sucesso', async () => {
    ;(prisma.proposta.findUnique as jest.Mock).mockResolvedValue({ id: 9, cargaId: 11, status: 'PENDENTE', carga: { empresaId: 1 } })
    const res: any = await recusarPOST(makeReq(`Bearer ${empresaToken}`), makeCtx('9'))
    expect(res.status).toBe(200)
  })
})
