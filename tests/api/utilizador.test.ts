import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { PUT } from "@/app/api/utilizador/route"

jest.mock("@/lib/prisma", () => ({
  user: { update: jest.fn() },
}))

jest.mock("@/lib/auth", () => ({
  verifyToken: jest.fn(),
}))

// Mock para NextRequest
function mockNextRequest(body: any, headers: Record<string, string> = {}, method = "PUT") {
  return {
    json: async () => body,
    headers: new Map(Object.entries(headers)),
    method,
  } as any
}

describe("PUT /api/utilizador", () => {
  it("deve retornar 401 se não tiver Authorization", async () => {
    const req = mockNextRequest({}, {})
    const response: any = await PUT(req)

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Não autorizado" })
  })

  it("deve retornar 401 se o token for inválido", async () => {
    ;(verifyToken as jest.Mock).mockReturnValueOnce({})

    const req = mockNextRequest({}, { authorization: "Bearer invalid" })
    const response: any = await PUT(req)

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Token inválido" })
  })

  it("deve retornar 400 se nenhum campo for fornecido", async () => {
    ;(verifyToken as jest.Mock).mockReturnValueOnce({ userId: 1 })

    const req = mockNextRequest({}, { authorization: "Bearer validtoken" })
    const response: any = await PUT(req)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: "Nenhum campo fornecido para atualização.",
    })
  })

  it("deve atualizar usuário com sucesso", async () => {
    ;(verifyToken as jest.Mock).mockReturnValueOnce({ userId: 1 })
    ;(prisma.user.update as jest.Mock).mockResolvedValueOnce({
      id: 1,
      theme: "escuro",
      searchRadius: 250,
    })

    const req = mockNextRequest(
      { theme: "escuro", searchRadius: 250 },
      { authorization: "Bearer validtoken" }
    )
    const response: any = await PUT(req)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      id: 1,
      theme: "escuro",
      searchRadius: 250,
    })
  })
})
