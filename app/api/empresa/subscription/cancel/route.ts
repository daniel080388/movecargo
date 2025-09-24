import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const existing = await prisma.subscription.findFirst({ where: { userId: user.uid } });
    if (!existing) return NextResponse.json({ error: 'Sem subscrição' }, { status: 404 });

  const updated = await prisma.subscription.update({ where: { id: existing.id }, data: { status: 'cancelled', currentPeriodEnd: new Date() } });
    return NextResponse.json({ subscription: updated });
  } catch (err: any) {
    console.error('Erro subscription cancel', err);
    return NextResponse.json({ error: 'Erro ao cancelar subscrição', details: String(err) }, { status: 500 });
  }
}
