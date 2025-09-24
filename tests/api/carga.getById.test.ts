/**
 * @jest-environment node
 */
import { GET as getById } from '@/app/api/cargas/[id]/route'
import prisma from '@/lib/prisma'

function makeCtx(id: string) {
  return { params: { id } } as any
}

function makeReq(): Request {
  return {} as any
}

describe('GET /api/cargas/[id]', () => {
  beforeEach(() => {
    ;(prisma.carga.findUnique as jest.Mock) = jest.fn()
  })

  it('400 para id inválido', async () => {
    const res: any = await getById(makeReq(), makeCtx('abc'))
    expect(res.status).toBe(400)
  })

  it('404 quando não encontrada', async () => {
    ;(prisma.carga.findUnique as jest.Mock).mockResolvedValue(null)
    const res: any = await getById(makeReq(), makeCtx('7'))
    expect(res.status).toBe(404)
  })

  it('200 retorna carga', async () => {
    ;(prisma.carga.findUnique as jest.Mock).mockResolvedValue({ id: 7, origem: 'Lisboa', destinos: [] })
    const res: any = await getById(makeReq(), makeCtx('7'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body?.id).toBe(7)
  })
})
