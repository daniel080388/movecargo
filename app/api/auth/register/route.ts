import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })
    }

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'Email já registado' }, { status: 400 })
    }

    const hashed = await hash(password, 10)

    // Accept both 'MOTORISTA' and 'TRANSPORTADORA' inputs, store as 'TRANSPORTADORA' after DB migration
    const roleStr = String(role).toUpperCase()
    const accept = ['EMPRESA', 'MOTORISTA', 'TRANSPORTADORA']
    if (!accept.includes(roleStr)) {
      return NextResponse.json({ error: 'Role inválido' }, { status: 400 })
    }
    const roleForDb = roleStr === 'MOTORISTA' ? 'TRANSPORTADORA' : roleStr

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: roleForDb as any },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })

    return NextResponse.json({ ok: true, user }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erro interno' }, { status: 500 })
  }
}
