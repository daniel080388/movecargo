"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getApiBase } from "@/lib/clientApiBase";

type Carga = {
  id: number;
  origem: string;
  destinos?: { cidade: string }[];
  tipoCaminhao?: string;
  pesoKg?: number;
  empresa?: { name?: string };
};

export default function MapaCargas() {
  const { token } = useAuth();
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCargas = async () => {
      setLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(getApiBase() + "/api/cargas", { headers });
        const text = await res.text();
        if (!res.ok) {
          // try parse JSON otherwise use text
          try {
            const parsed = JSON.parse(text);
            setErro(parsed?.error || "Erro ao buscar cargas");
          } catch {
            // if server returned full HTML page (Next 404) don't render raw HTML
            const lower = (text || "").toLowerCase();
            if (lower.includes("<!doctype") || lower.includes("<html")) {
              setErro("Erro ao buscar cargas (resposta HTML do servidor)");
            } else {
              // truncate long messages
              const trimmed = (text || "").slice(0, 300);
              setErro(trimmed || "Erro ao buscar cargas");
            }
          }
          setCargas([]);
        } else {
          try {
            const data = JSON.parse(text);
            setCargas(Array.isArray(data) ? data : []);
            setErro(null);
          } catch (e) {
            setErro("Resposta inválida do servidor");
            setCargas([]);
          }
        }
      } catch (err) {
        console.error(err);
        setErro("Erro de comunicação com o servidor");
        setCargas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCargas();
  }, [token]);

  if (erro) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-3">Cargas</h3>
        <p className="text-red-600">{erro}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      {loading && <p>Carregando...</p>}

      {!loading && cargas.length === 0 && (
        <p className="text-gray-600">Nenhuma carga encontrada.</p>
      )}

      {cargas.length > 0 && (
        <>
          <h3 className="font-semibold mb-3">Cargas encontradas</h3>
          <ul className="space-y-3">
            {cargas.map((c) => (
              <li key={c.id} className="border p-3 rounded">
                <div className="text-sm text-gray-700">{c.origem} → {c.destinos && c.destinos[0]?.cidade}</div>
                <div className="text-xs text-gray-500">Empresa: {c.empresa?.name || '—'}</div>
                <div className="text-xs text-gray-500">Tipo: {c.tipoCaminhao || '—'} • Peso: {c.pesoKg ?? '—'} kg</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
