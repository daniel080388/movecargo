import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal }); else dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const subs = await prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, email: true } },
        plan: { select: { id: true, name: true, stripeId: true } },
      },
    });

    if (!subs || subs.length === 0) {
      console.log('Nenhuma subscription encontrada.');
      return;
    }

    console.log(`Encontradas ${subs.length} subscriptions (últimas):\n`);
    subs.forEach((s) => {
      const user = s.user ? `${s.user.id} (${s.user.email || 'no-email'})` : 'null';
      const plan = s.plan ? `${s.plan.id} (${s.plan.name || s.plan.stripeId || 'no-name'})` : 'null';
      const cpe = s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toISOString() : 'null';
      console.log(`- stripeSubId=${s.stripeSubId} status=${s.status} user=${user} plan=${plan} currentPeriodEnd=${cpe}`);
    });
  } catch (err) {
    console.error('Erro ao consultar subscriptions:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
