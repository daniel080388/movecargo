// app/api/empresa/propostas/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getUserFromRequest(req);

  // Se não houver token válido
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Apenas empresas podem acessar
  if (user.role.toLowerCase() !== "empresa") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    // Buscar todas as propostas feitas às cargas desta empresa
    const propostas = await prisma.proposta.findMany({
      where: {
        carga: {
          empresaId: user.uid,
        },
      },
      include: {
        carga: true,
        motorista: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(propostas);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erro ao buscar propostas", details: String(err) },
      { status: 500 }
    );
  }
}
