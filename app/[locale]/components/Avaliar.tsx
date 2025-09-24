"use client";

import { useState } from "react";
import { getApiBase } from "@/lib/clientApiBase";

export default function Avaliar({ toUserId }: { toUserId: number }) {
  const [rating, setRating] = useState(5);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);

  const enviar = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiBase() + "/api/avaliacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toUserId, rating, comentario }),
      });
      if (!res.ok) throw new Error("Erro");
      alert("Avaliação enviada");
      setComentario("");
    } catch (err) {
      alert("Erro ao enviar avaliação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <label className="block mb-2 font-semibold">Avaliar</label>
      <div className="flex gap-2 items-center mb-2">
        <input type="range" min={0} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} />
        <span className="font-bold">{rating}</span>
      </div>
      <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} className="w-full border p-2 rounded mb-2" />
      <button onClick={enviar} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Enviando...' : 'Enviar Avaliação'}</button>
    </div>
  );
}
