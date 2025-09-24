import { Role } from '@prisma/client'
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    // Guard: allow in non-production or with header secret
    const secret = process.env.SEED_SECRET;
    if (process.env.NODE_ENV === 'production') {
      const hdr = req.headers.get('x-seed-secret');
      if (!secret || hdr !== secret) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await req.json().catch(() => ({} as any));
    const emailEmpresa = body?.empresaEmail || 'empresaA@example.com';
    const emailMotorista = body?.motoristaEmail || 'transx@example.com';
    const password = body?.password || 'password123';

    const hash = await bcrypt.hash(password, 10);

    const empresa = await prisma.user.upsert({
      where: { email: emailEmpresa },
      update: { name: 'Empresa A', role: 'EMPRESA' },
      create: { name: 'Empresa A', email: emailEmpresa, password: hash, role: 'EMPRESA', defaultLocale: 'pt' },
    });

    const motorista = await prisma.user.upsert({
      where: { email: emailMotorista },
  update: { name: 'Transportadora X', role: Role.TRANSPORTADORA },
  create: { name: 'Transportadora X', email: emailMotorista, password: hash, role: Role.TRANSPORTADORA, defaultLocale: 'pt' },
    });

    // Ensure at least one carga for empresa
    let carga = await prisma.carga.findFirst({ where: { empresaId: empresa.id } });
    if (!carga) {
      carga = await prisma.carga.create({
        data: {
          titulo: 'Carga de teste',
          descricao: 'Gerada pelo seed de testes',
          origem: 'Porto, PT',
          empresaId: empresa.id,
          pesoKg: 1000,
          multiDestino: false,
          destinos: { create: [{ cidade: 'Lisboa, PT', ordem: 1, latitude: 38.7223, longitude: -9.1393 }] },
        },
      });
    }

    // Ensure at least one PENDENTE proposta for that carga from motorista
    const existing = await prisma.proposta.findFirst({ where: { cargaId: carga.id, motoristaId: motorista.id, status: 'PENDENTE' as any } });
    if (!existing) {
      await prisma.proposta.create({ data: { cargaId: carga.id, motoristaId: motorista.id, valor: 500, mensagem: 'Posso recolher amanhã', status: 'PENDENTE' as any } });
    }

    return NextResponse.json({ ok: true, empresaId: empresa.id, motoristaId: motorista.id, cargaId: carga.id });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
