import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userIdParam = url.searchParams.get('userId');
    const limitParam = url.searchParams.get('limit');
    const cursorParam = url.searchParams.get('cursor');

    const parsedLimit = Number(limitParam || '20');
    const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(100, parsedLimit)) : 20;
    const take = limit + 1; // fetch one extra to detect `hasMore`

    // helper to query with createdAt cursor (descending)
    const queryForUser = async (userId: number) => {
      const where: any = { toUserId: userId };
      if (cursorParam) {
        const cursorDate = new Date(cursorParam);
        if (!isNaN(cursorDate.getTime())) where.createdAt = { lt: cursorDate };
      }

      const rows = await prisma.avaliacao.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        include: { fromUser: { select: { id: true, name: true, email: true } } },
      });

      const hasMore = rows.length > limit;
      const items = rows.slice(0, limit);
      const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;
      return { items, hasMore, nextCursor };
    };

    // If userId provided explicitly, use it
    if (userIdParam) {
      const userId = Number(userIdParam);
      const res = await queryForUser(userId);
      return NextResponse.json({ avaliacoes: res.items, hasMore: res.hasMore, nextCursor: res.nextCursor });
    }

    // Otherwise, if authenticated, return received reviews for current user
    const user = getUserFromRequest(req);
    if (user) {
      const res = await queryForUser(user.uid);
      return NextResponse.json({ avaliacoes: res.items, hasMore: res.hasMore, nextCursor: res.nextCursor });
    }

    // Fallback: unauthenticated listing (limited) — for demo only
    const rows = await prisma.avaliacao.findMany({
      take: Math.min(50, limit),
      orderBy: { createdAt: 'desc' },
      include: { fromUser: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({ avaliacoes: rows, hasMore: false, nextCursor: null });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao buscar avaliacoes', details: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const body = await req.json();
    const { toUserId, rating, comentario } = body;
    if (!toUserId || rating == null) return NextResponse.json({ error: 'Campos obrigatorios' }, { status: 400 });

    const toUser = Number(toUserId);
    const numRating = Number(rating);
    if (user.uid === toUser) return NextResponse.json({ error: 'Nao pode avaliar a si proprio' }, { status: 400 });
    if (!Number.isFinite(numRating) || numRating < 0 || numRating > 5) return NextResponse.json({ error: 'Rating deve estar entre 0 e 5' }, { status: 400 });

    const safeComentario = (typeof comentario === 'string' ? comentario.trim().slice(0, 1000) : '');

    const nova = await prisma.avaliacao.create({ data: { fromUserId: user.uid, toUserId: toUser, rating: numRating, comentario: safeComentario } });
    return NextResponse.json({ avaliacao: nova }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao criar avaliacao', details: String(err) }, { status: 500 });
  }
}
