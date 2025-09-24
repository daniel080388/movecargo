/**
 * @jest-environment node
 */
import { GET as healthGET } from '@/app/api/health/route'

describe('/api/health', () => {
  it('deve responder com ok:true e time', async () => {
    const res: any = await healthGET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(typeof json.time).toBe('string')
  })
})
