import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PUT(req: NextRequest) {
  const authHeader = req.headers.get("authorization")

  // 🔒 Sem Authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = verifyToken(token) as { userId?: number }
    const userId = decoded?.userId

    if (!userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const body = await req.json()

    const {
      name,
      email,
      defaultLocale,
      notificationPreferences,
      theme,
      searchRadius,
      latitude,
      longitude,
    } = body

    // Nenhum campo fornecido
    if (
      !name &&
      !email &&
      !defaultLocale &&
      !notificationPreferences &&
      !theme &&
      typeof searchRadius !== "number" &&
      typeof latitude !== "number" &&
      typeof longitude !== "number"
    ) {
      return NextResponse.json(
        { error: "Nenhum campo fornecido para atualização." },
        { status: 400 }
      )
    }

    // Monta os dados a atualizar dinamicamente
    const dataToUpdate: Record<string, unknown> = {}
    if (name) dataToUpdate.name = name
    if (email) dataToUpdate.email = email
    if (defaultLocale) dataToUpdate.defaultLocale = defaultLocale
    if (notificationPreferences) dataToUpdate.notificationPreferences = notificationPreferences
    if (theme) dataToUpdate.theme = theme
    if (typeof searchRadius === "number") dataToUpdate.searchRadius = searchRadius
    if (typeof latitude === "number") dataToUpdate.latitude = latitude
    if (typeof longitude === "number") dataToUpdate.longitude = longitude

    // Atualiza no banco
    const user = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    })

    return NextResponse.json(user, { status: 200 })
  } catch (err) {
    console.error("Erro no update:", err)
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  let token: string | null = null
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1]
  // fallback to cookie named 'token'
  if (!token) {
    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/token=([^;]+)/)
    if (match) token = decodeURIComponent(match[1])
  }

  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const decoded = verifyToken(token) as { userId?: number }
    const userId = decoded?.userId
    if (!userId) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

    // delete user (cascade relations may need to be handled depending on schema)
    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro a apagar utilizador', err)
    return NextResponse.json({ error: 'Erro ao eliminar conta' }, { status: 500 })
  }
}
