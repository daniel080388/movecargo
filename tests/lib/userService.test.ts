import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { updateUserFromToken } from "@/lib/userService"

jest.mock("@/lib/prisma", () => ({
  user: { update: jest.fn() },
}))

jest.mock("@/lib/auth", () => ({
  verifyToken: jest.fn(),
}))

describe("updateUserFromToken", () => {
  it("deve lançar erro se não houver token", async () => {
    await expect(updateUserFromToken("", { theme: "claro" }))
      .rejects.toThrow("Token ausente")
  })

  it("deve lançar erro se o token for inválido", async () => {
    ;(verifyToken as jest.Mock).mockReturnValueOnce({})

    await expect(updateUserFromToken("invalid", { theme: "claro" }))
      .rejects.toThrow("Token inválido")
  })

  it("deve atualizar o usuário com sucesso", async () => {
    const fakeToken = "abc.def.ghi"
    const fakeUserId = 123
    const updates = { theme: "escuro", searchRadius: 200 }

    ;(verifyToken as jest.Mock).mockReturnValueOnce({ userId: fakeUserId })
    ;(prisma.user.update as jest.Mock).mockResolvedValueOnce({ id: fakeUserId, ...updates })

    const result = await updateUserFromToken(fakeToken, updates)

    expect(verifyToken).toHaveBeenCalledWith(fakeToken)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: fakeUserId },
      data: updates,
    })
    expect(result).toEqual({ id: fakeUserId, ...updates })
  })
})
