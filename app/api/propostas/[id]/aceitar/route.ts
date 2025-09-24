import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request, context: any) {
  const params = context?.params && typeof context.params.then === 'function' ? await context.params : context.params;
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "empresa") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

  const propostaId = parseInt(params.id, 10);
    if (isNaN(propostaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const proposta = await prisma.proposta.findUnique({
      where: { id: propostaId },
      include: { carga: true },
    });

    if (!proposta) {
      return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
    }

    if (proposta.carga.empresaId !== user.uid) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (proposta.status !== "PENDENTE") {
      return NextResponse.json({ error: "Proposta já processada" }, { status: 400 });
    }

    // Atualiza esta proposta como ACEITA (liberando contactos) e recusa todas as outras pendentes
    await prisma.$transaction([
      prisma.proposta.update({
        where: { id: proposta.id },
        data: { status: "ACEITA", contactsReleased: true },
      }),
      prisma.proposta.updateMany({
        where: {
          cargaId: proposta.cargaId,
          id: { not: proposta.id },
          status: "PENDENTE",
        },
        data: { status: "RECUSADA" },
      }),
    ]);

    // Buscar a proposta atualizada para devolver ao frontend (inclui motorista)
    const propostaAtualizada = await prisma.proposta.findUnique({
      where: { id: proposta.id },
      include: { motorista: { select: { id: true, name: true, email: true } }, carga: true },
    });

    return NextResponse.json({ message: "Proposta aceite com sucesso.", proposta: propostaAtualizada }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: "Erro ao aceitar proposta", details: String(err) }, { status: 500 });
  }
}
