import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  let userId: number;

  try {
    const decoded: any = verifyToken(token);
    userId = decoded.userId;
    if (!userId) throw new Error("Token inválido");
  } catch (err) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      searchRadius: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!user || user.latitude == null || user.longitude == null || user.searchRadius == null) {
    return NextResponse.json(
      { error: "Usuário sem localização ou raio de busca" },
      { status: 400 }
    );
  }

  const lat = user.latitude;
  const lon = user.longitude;
  const radius = user.searchRadius;

  // Busca cargas dentro do raio
  const cargas: any[] = await prisma.$queryRaw`
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
    WHERE c."latitude" IS NOT NULL AND c."longitude" IS NOT NULL
    HAVING distance <= ${radius}
    ORDER BY distance ASC
  `;

  // Para cada carga, buscar propostas
  const cargasComPropostas = await Promise.all(
    cargas.map(async (carga) => {
      const propostas = await prisma.proposta.findMany({
        where: { cargaId: carga.id },
        include: { motorista: { select: { id: true, name: true } } },
      });

      return {
        ...carga,
        empresa: {
          id: carga.empresaId,
          name: carga.empresaName,
        },
        propostas,
      };
    })
  );

  return NextResponse.json(cargasComPropostas);
}
