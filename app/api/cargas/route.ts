import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";
import { geocodeLocation } from "@/lib/geocode";

// GET - search cargas with filters (lat/lon or city, radiusKm 0..400)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;

    const latParam = sp.get("lat");
    const lonParam = sp.get("lon");
    const cidade = sp.get("cidade") || sp.get("origem");
    const raioKm = Math.min(Number(sp.get("raioKm") || sp.get("radius") || 100), 400);
    const tipoCaminhao = sp.get("tipoCaminhao");
    const incluirMeias = sp.get("incluirMeias");
    const multiDestino = sp.get("multiDestino");
    const destinoFiltro = sp.get("destino");

    let lat: number | null = latParam ? Number(latParam) : null;
    let lon: number | null = lonParam ? Number(lonParam) : null;

    if ((!lat || !lon) && cidade) {
      const coord = await geocodeLocation(cidade);
      if (coord) {
        lat = coord.latitude;
        lon = coord.longitude;
      }
    }

    if (!lat || !lon) {
      // When no coordinates or city are provided, return an empty list instead
      // of an error page. The frontend can show an empty state.
      console.warn("/api/cargas: sem lat/lon nem cidade - a pesquisa devolve lista vazia");
      return NextResponse.json([], { status: 200 });
    }

    // Build SQL with Haversine distance
    const conditions: Prisma.Sql[] = [Prisma.sql`c."latitude" IS NOT NULL AND c."longitude" IS NOT NULL`];
    if (tipoCaminhao) conditions.push(Prisma.sql`LOWER(c."tipoCaminhao") = LOWER(${tipoCaminhao})`);
    if (incluirMeias === "false") conditions.push(Prisma.sql`c."meiaCarga" = false`);
    if (multiDestino === "true") conditions.push(Prisma.sql`c."multiDestino" = true`);
    if (destinoFiltro) conditions.push(Prisma.sql`EXISTS (SELECT 1 FROM "Destino" d WHERE d."cargaId" = c.id AND d.cidade ILIKE ${'%' + destinoFiltro + '%'})`);
  const whereConditions = Prisma.join(conditions, ' AND ');

    const inner = Prisma.sql`
      SELECT 
        c.*, 
        u.id AS "empresaId",
        u.name AS "empresaName",
        (
          6371 * acos(
            cos(radians(${lat})) * cos(radians(c."latitude")) *
            cos(radians(c."longitude") - radians(${lon})) +
            sin(radians(${lat})) * sin(radians(c."latitude"))
          )
        ) AS distance
      FROM "Carga" c
      JOIN "User" u ON u.id = c."empresaId"
  WHERE ${whereConditions}
    `;

    const cargas: any[] = await prisma.$queryRaw(Prisma.sql`
      SELECT * FROM (${inner}) t
      WHERE t.distance <= ${raioKm}
      ORDER BY t.distance ASC
      LIMIT 200
    `);

    const cargasComPropostas = await Promise.all(
      cargas.map(async (carga) => {
        const propostas = await prisma.proposta.findMany({
          where: { cargaId: carga.id },
          include: { motorista: { select: { id: true, name: true } } },
        });

        // fetch destinos
        const destinos = await prisma.destino.findMany({ where: { cargaId: carga.id }, orderBy: { ordem: 'asc' } });

        return {
          ...carga,
          empresa: { id: carga.empresaId, name: carga.empresaName },
          propostas,
          destinos,
        };
      })
    );

    return NextResponse.json(cargasComPropostas);
  } catch (err: any) {
    console.error('Erro na pesquisa de cargas:', err);
    return NextResponse.json({ error: 'Erro ao pesquisar cargas', details: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "empresa") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      origem,
      titulo,
      descricao,
      destinos,
      destino,
      tipoCaminhao,
      pesoKg,
      dataInicio,
      dataFim,
      expresso,
      meiaCarga,
      multiDestino,
      altura,
      largura,
      comprimento,
      observacoes,
    } = body;

    const coordOrigem = await geocodeLocation(origem);

    // Build destinos relation if provided or fallback to single destino string
    const destinosData = [] as any[];
    if (Array.isArray(destinos) && destinos.length > 0) {
      for (const d of destinos) {
        if (d.cidade && d.latitude != null && d.longitude != null) {
          destinosData.push({ cidade: d.cidade, latitude: Number(d.latitude), longitude: Number(d.longitude), ordem: Number(d.ordem) || 1 });
        }
      }
    } else if (destino) {
      destinosData.push({ cidade: destino, latitude: coordOrigem?.latitude ?? null, longitude: coordOrigem?.longitude ?? null, ordem: 1 });
    }

    // use the typed prisma client directly
    const novaCarga = await prisma.carga.create({
      data: {
        titulo: titulo || (origem ? `Carga de ${origem}` : "Carga"),
        descricao: descricao || "",
        origem,
        tipoCaminhao,
        pesoKg: pesoKg ? Number(pesoKg) : null,
        dataInicio: dataInicio ? new Date(dataInicio) : null,
        dataFim: dataFim ? new Date(dataFim) : null,
        expresso: Boolean(expresso),
        meiaCarga: Boolean(meiaCarga),
        multiDestino: Boolean(multiDestino),
        altura: altura ? Number(altura) : null,
        largura: largura ? Number(largura) : null,
        comprimento: comprimento ? Number(comprimento) : null,
        empresaId: user.uid,
        latitude: coordOrigem?.latitude,
        longitude: coordOrigem?.longitude,
        destinos: destinosData.length > 0 ? { create: destinosData } : undefined,
      },
    });

    return NextResponse.json(novaCarga, { status: 201 });
  } catch (err: any) {
    console.error("Erro ao criar carga:", err);
    return NextResponse.json(
      { error: "Erro ao criar carga", details: err.message },
      { status: 500 }
    );
  }
}
