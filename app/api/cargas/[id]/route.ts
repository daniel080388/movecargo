import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, context: any) {
  try {
    const paramsObj = context?.params;
    const resolvedParams = paramsObj && typeof paramsObj.then === 'function' ? await paramsObj : paramsObj;
    const id = Number(resolvedParams?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const carga = await prisma.carga.findUnique({
      where: { id },
      include: {
        empresa: { select: { id: true, name: true, email: true } },
        destinos: { orderBy: { ordem: 'asc' } },
        propostas: { select: { id: true }, take: 1 },
      },
    });

    if (!carga) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(carga);
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao buscar carga', details: String(err) }, { status: 500 });
  }
}
