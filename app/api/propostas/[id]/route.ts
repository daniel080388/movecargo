// app/api/propostas/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request, context: any) {
  const params = context?.params && typeof context.params.then === 'function' ? await context.params : context.params;
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

  const propostaId = parseInt(params.id, 10);
    if (isNaN(propostaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const proposta = await prisma.proposta.findUnique({
      where: { id: propostaId },
      include: {
        carga: { include: { empresa: { select: { id: true, name: true } } } },
        motorista: { select: { id: true, name: true, email: true } },
      },
    });

    if (!proposta) {
      return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
    }

    // Permissões: empresa dona da carga ou motorista que fez a proposta
    const isEmpresaDona = user.role === "empresa" && proposta.carga.empresa.id === user.uid;
    const isMotoristaAutor = user.role === "motorista" && proposta.motorista.id === user.uid;

    if (!isEmpresaDona && !isMotoristaAutor) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json(proposta);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erro ao buscar proposta", details: String(err) },
      { status: 500 }
    );
  }
}
