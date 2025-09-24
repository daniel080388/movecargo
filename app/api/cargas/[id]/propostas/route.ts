import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(_req: Request, context: any) {
  try {
    const paramsObj = context?.params;
    const resolvedParams = paramsObj && typeof paramsObj.then === 'function' ? await paramsObj : paramsObj;
    const cargaId = Number(resolvedParams?.id);
    if (Number.isNaN(cargaId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    // Return list of proposals for the carga; if prisma model not present, return empty
    try {
      // @ts-ignore
      const propostas = await prisma.proposta.findMany({ where: { cargaId }, include: { motorista: { select: { id: true, name: true, email: true } } } });
      return NextResponse.json({ propostas });
    } catch (e) {
      return NextResponse.json({ propostas: [] });
    }
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request, context: any) {
  try {
    const user = getUserFromRequest(req);
    // Accept both during transition
    if (!user || !['transportadora', 'motorista'].includes(user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 401 });
    }
    const paramsObj = context?.params;
    const resolvedParams = paramsObj && typeof paramsObj.then === 'function' ? await paramsObj : paramsObj;
    const cargaId = Number(resolvedParams?.id);
    if (Number.isNaN(cargaId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const valor = Number(body?.valor);
    const mensagem = typeof body?.mensagem === 'string' ? body.mensagem : '';
    if (!Number.isFinite(valor) || valor <= 0) return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    const created = await prisma.proposta.create({ data: { cargaId, valor, mensagem, motoristaId: user.uid, status: 'PENDENTE' } });
    return NextResponse.json({ message: 'Proposta criada com sucesso!', proposta: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao criar proposta', details: String(err) }, { status: 500 });
  }
}
