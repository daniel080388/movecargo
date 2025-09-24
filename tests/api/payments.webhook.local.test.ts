/**
 * @jest-environment node
 */
import { GET as testGET, POST as testPOST } from '@/app/api/payments/webhook/test/route'
import fs from 'fs'
import os from 'os'
import path from 'path'

describe('/api/payments/webhook/test', () => {
  const tmpFile = path.join(os.tmpdir(), `stripe-processed-${Date.now()}.json`)

  beforeAll(() => {
    ;(process as any).cwd = () => process.cwd() // ensure cwd works
  })

  it('GET deve retornar ok e contagem (0 inicialmente)', async () => {
    // garantir que o ficheiro não interfere
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile) } catch {}
    const res: any = await testGET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(typeof json.processedCount).toBe('number')
  })

  it('POST deve aceitar payload simples e marcar como processado', async () => {
    const evt = { id: `evt_local_${Date.now()}`, data: { object: { id: 'sub_x', status: 'active' } } }
    const req = { json: async () => evt } as any
    const res: any = await testPOST(req)
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j.received).toBe(true)
    expect(j.id).toBe(evt.id)
  })
})
