"use client";
import React, { useEffect, useState } from 'react';

type Avaliacao = {
  id: number;
  fromUser: { id: number; name: string; email: string } | null;
  rating: number;
  comentario?: string | null;
  createdAt: string;
};

export default function AvaliacoesList({ initialUserId }: { initialUserId?: number }) {
  const [items, setItems] = useState<Avaliacao[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load(cursor?: string | null) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '10');
      if (initialUserId) params.set('userId', String(initialUserId));
      if (cursor) params.set('cursor', cursor);
      const res = await fetch('/api/avaliacoes?' + params.toString());
      const data = await res.json();
      if (Array.isArray(data.avaliacoes)) {
        setItems((prev) => (cursor ? [...prev, ...data.avaliacoes] : data.avaliacoes));
        setHasMore(Boolean(data.hasMore));
        setNextCursor(data.nextCursor || null);
      }
    } catch (err) {
      console.error('Erro ao carregar avaliacoes', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUserId]);

  return (
    <div>
      <ul className="space-y-4">
        {items.map((a) => (
          <li key={a.id} className="border rounded p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{a.fromUser?.name || 'Anónimo'}</div>
                <div className="text-sm text-gray-500">{new Date(a.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-xl">{a.rating}★</div>
            </div>
            {a.comentario && <p className="mt-2 text-sm">{a.comentario}</p>}
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="mt-4 text-center">
          <button className="btn-primary" onClick={() => load(nextCursor)} disabled={loading}>
            {loading ? 'A carregar...' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  );
}
