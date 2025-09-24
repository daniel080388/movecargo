import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

type SearchBody = {
  query?: string
  origin?: { lat: number; lng: number }
  destination?: { lat: number; lng: number }
  radiusKm?: number
  weight?: number
  page?: number
  perPage?: number
}

const toFloat = (v: any) => (v == null ? undefined : Number(v))

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SearchBody
    const page = Math.max(1, body.page || 1)
    const perPage = Math.min(100, body.perPage || 20)

    // Basic text filter
    const where: any = {}
    if (body.query) {
      where.OR = [
        { titulo: { contains: body.query, mode: 'insensitive' } },
        { descricao: { contains: body.query, mode: 'insensitive' } },
      ]
    }
    if (toFloat(body.weight) != null) {
      where.pesoMax = { gte: toFloat(body.weight) }
    }

    // If origin provided, compute approximate bounding box (simple, not exact)
    // and then compute distance ordering using Haversine via raw query if available.
    const useRawDistance = body.origin || body.destination

    if (!useRawDistance) {
      const results = await (prisma as any).carga.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ results, page, perPage })
    }

    // Use raw query for distance scoring when lat/lng exist on cargas.destino
    const lat = body.origin?.lat ?? body.destination?.lat
    const lng = body.origin?.lng ?? body.destination?.lng
    const radiusKm = toFloat(body.radiusKm) ?? 200

    const offset = (page - 1) * perPage
    const query = `
      SELECT c.*, (
        6371 * acos(
          cos(radians(${lat})) * cos(radians(c.destino_lat)) * cos(radians(c.destino_lng) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(c.destino_lat))
        )
      ) as distance_km
      FROM "Carga" c
      WHERE c.destino_lat IS NOT NULL AND c.destino_lng IS NOT NULL
      ORDER BY distance_km ASC
      LIMIT ${perPage} OFFSET ${offset}
    `

    const raw = await prisma.$queryRawUnsafe(query)
    return NextResponse.json({ results: raw, page, perPage })
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 })
  }
}
