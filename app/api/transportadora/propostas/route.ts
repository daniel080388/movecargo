// app/api/transportadora/propostas/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getUserFromRequest(req);

  // Accept both during transition
  if (!user || !["transportadora", "motorista"].includes(user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 401 });
  }

  const propostas = await prisma.proposta.findMany({
    where: { motoristaId: user.uid },
    include: { carga: true },
  });

  return NextResponse.json(propostas);
}
