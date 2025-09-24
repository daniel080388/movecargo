import { Role } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  await prisma.avaliacao.deleteMany()
  await prisma.proposta.deleteMany()
  await prisma.destino.deleteMany()
  await prisma.carga.deleteMany()
  await prisma.user.deleteMany()

  // Cria users (empresas e transportadoras)
  const passwordHash = await bcrypt.hash('password123', 10)

  const empresa1 = await prisma.user.create({
    data: {
      name: 'Empresa A',
      email: 'empresaA@example.com',
      password: passwordHash,
      role: 'EMPRESA',
      latitude: 41.1579438,
      longitude: -8.6291053,
      defaultLocale: 'pt'
    }
  })

  const empresa2 = await prisma.user.create({
    data: {
      name: 'Empresa B',
      email: 'empresaB@example.com',
      password: passwordHash,
      role: 'EMPRESA',
      latitude: 48.856614,
      longitude: 2.3522219,
      defaultLocale: 'fr'
    }
  })

  const transport1 = await prisma.user.create({
    data: {
      name: 'Transportadora X',
      email: 'transx@example.com',
      password: passwordHash,
  role: Role.TRANSPORTADORA,
      latitude: 50.1109221,
      longitude: 8.6821267,
      defaultLocale: 'de'
    }
  })

  const transport2 = await prisma.user.create({
    data: {
      name: 'Transportadora Y',
      email: 'transy@example.com',
      password: passwordHash,
  role: Role.TRANSPORTADORA,
      latitude: 51.5073509,
      longitude: -0.1277583,
      defaultLocale: 'en'
    }
  })

  // Cargas
  const carga1 = await prisma.carga.create({
    data: {
      titulo: 'Carga de frutas',
      descricao: 'Frutas frescas para entrega',
      origem: 'Porto, PT',
      pesoKg: 1200,
      tipoCaminhao: 'camiao_tautliner',
      comprimento: 12.0,
      largura: 2.5,
      altura: 2.7,
      meiaCarga: false,
      expresso: false,
      dataInicio: new Date(),
      dataFim: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      multiDestino: false,
      empresaId: empresa1.id,
      latitude: 41.1579438,
      longitude: -8.6291053,
      destinos: {
        create: [
          { cidade: 'Lisboa, PT', latitude: 38.7222524, longitude: -9.1393366, ordem: 1 }
        ]
      }
    },
    include: { destinos: true }
  })

  const carga2 = await prisma.carga.create({
    data: {
      titulo: 'Peças industriais',
      descricao: 'Peças grandes, paletizadas',
      origem: 'Paris, FR',
      pesoKg: 3000,
      tipoCaminhao: 'camiao_porta-pallets',
      comprimento: 8.0,
      largura: 2.4,
      altura: 2.8,
      meiaCarga: true,
      expresso: true,
      dataInicio: new Date(),
      dataFim: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      multiDestino: true,
      empresaId: empresa2.id,
      latitude: 48.856614,
      longitude: 2.3522219,
      destinos: {
        create: [
          { cidade: 'Lyon, FR', latitude: 45.764043, longitude: 4.835659, ordem: 1 },
          { cidade: 'Marseille, FR', latitude: 43.296482, longitude: 5.36978, ordem: 2 }
        ]
      }
    },
    include: { destinos: true }
  })

  // Propostas de exemplo
  await prisma.proposta.create({
    data: {
      valor: 800,
      mensagem: 'Podemos recolher em 24h',
      cargaId: carga1.id,
      motoristaId: transport1.id
    }
  })

  await prisma.proposta.create({
    data: {
      valor: 1200,
      mensagem: 'Entrega prioritaria',
      cargaId: carga2.id,
      motoristaId: transport2.id
    }
  })

  // Plans example (Stripe prices would map here)
  const planBasic = await prisma.plan.create({ data: { stripeId: 'price_basic_test', name: 'Basic', description: 'Plano gratuito com limites', priceCents: 0, currency: 'eur', active: true } });
  const planPro = await prisma.plan.create({ data: { stripeId: 'price_pro_test', name: 'Pro', description: 'Plano pago com privilégios', priceCents: 1999, currency: 'eur', active: true } });

  // Example subscription for empresa1 on Basic
  await prisma.subscription.create({ data: { userId: empresa1.id, planId: planBasic.id, stripeSubId: 'sub_test_1', status: 'active' } });

  console.log('Seed concluída')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
