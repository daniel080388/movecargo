import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const sub = await prisma.subscription.findFirst({ where: { userId: user.uid }, include: { plan: true } });
    return NextResponse.json({ subscription: sub });
  } catch (err: any) {
    console.error('Erro subscription GET', err);
    return NextResponse.json({ error: 'Erro ao buscar subscrição', details: String(err) }, { status: 500 });
  }
}
