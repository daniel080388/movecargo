// lib/userService.ts
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function updateUserFromToken(token: string, updates: Record<string, unknown>) {
  if (!token) throw new Error("Token ausente")

  const decoded = verifyToken(token) as { userId?: number }
  if (!decoded?.userId) throw new Error("Token inválido")

  const user = await prisma.user.update({
    where: { id: decoded.userId },
    data: updates,
  })

  return user
}
