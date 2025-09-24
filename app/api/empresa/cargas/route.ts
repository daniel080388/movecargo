// app/api/empresa/cargas/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { geocodeLocation } from "@/lib/geocode"

// 📌 GET - Listar cargas da empresa autenticada
export async function GET(req: Request) {
  const user = getUserFromRequest(req)

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  if (user.role !== "empresa") {
    return NextResponse.json({ error: "Apenas empresas podem listar as suas cargas" }, { status: 403 })
  }

  try {
    const cargas = await prisma.carga.findMany({
      where: { empresaId: user.uid },
      include: {
        propostas: {
          include: {
            motorista: { select: { id: true, name: true, email: true } }
          }
        }
      }
    })

    return NextResponse.json(cargas)
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erro ao buscar cargas", details: String(err) },
      { status: 500 }
    )
  }
}

// 📌 POST - Criar nova carga
export async function POST(req: Request) {
  const user = getUserFromRequest(req)

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  if (user.role !== "empresa") {
    return NextResponse.json({ error: "Apenas empresas podem criar cargas" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { titulo, descricao, origem, destino, destinos, pesoKg } = body

    if (!titulo || !origem || (!destino && !(Array.isArray(destinos) && destinos.length > 0)) || !pesoKg) {
      return NextResponse.json({ error: "Campos obrigatórios em falta" }, { status: 400 })
    }

    const coordOrigem = await geocodeLocation(origem)

    const destinosData = [] as any[]
    if (Array.isArray(destinos) && destinos.length > 0) {
      for (const d of destinos) {
        if (d.cidade && d.latitude != null && d.longitude != null) {
          destinosData.push({ cidade: d.cidade, latitude: Number(d.latitude), longitude: Number(d.longitude), ordem: Number(d.ordem) || 1 })
        }
      }
    } else if (destino) {
      destinosData.push({ cidade: destino, latitude: coordOrigem?.latitude ?? null, longitude: coordOrigem?.longitude ?? null, ordem: 1 })
    }

    const novaCarga = await prisma.carga.create({
      data: {
        titulo,
        descricao,
        origem,
        tipoCaminhao: null,
        pesoKg: Number(pesoKg),
        empresaId: user.uid,
        latitude: coordOrigem?.latitude,
        longitude: coordOrigem?.longitude,
        destinos: destinosData.length > 0 ? { create: destinosData } : undefined,
      },
    })

    return NextResponse.json(
      { message: "Carga criada com sucesso!", carga: novaCarga },
      { status: 201 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erro ao criar carga", details: String(err) },
      { status: 500 }
    )
  }
}
