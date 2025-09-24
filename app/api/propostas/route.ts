import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"

export async function POST(req: Request) {
  const user = getUserFromRequest(req) // <- garante que pega do header

  // Accept both during terminology transition
  if (!user || !["transportadora", "motorista"].includes(user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { cargaId, valor, mensagem } = body

    if (!cargaId || !valor) {
      return NextResponse.json(
        { error: "Campos obrigatórios: cargaId, valor" },
        { status: 400 }
      )
    }

    const proposta = await prisma.proposta.create({
      data: {
        cargaId,
        valor,
        mensagem: mensagem || "",
        // Field remains motoristaId in DB schema for now
        motoristaId: user.uid,
      },
    })

    return NextResponse.json({
      message: "Proposta criada com sucesso!",
      proposta,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erro ao criar proposta", details: String(err) },
      { status: 500 }
    )
  }
}
