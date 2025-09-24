"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

export default function HistoricoPropostasPage() {
  const { token } = useAuth();
  const t = useTranslations("HistoricoPropostas");

  const [propostas, setPropostas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const fetchPropostas = async () => {
    if (!token) return;

    setLoading(true);
    setErro("");

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch(origin + "/api/transportadora/propostas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || t("erroAoBuscar"));
      } else {
  // API returns array
  setPropostas(Array.isArray(data) ? data : data.propostas || []);
      }
    } catch {
      setErro(t("erroServidor"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropostas();
  }, [token]);

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">
        {t("titulo")}
      </h1>

      {erro && <p className="text-red-600">{erro}</p>}

      {loading ? (
        <p>{t("carregando")}</p>
      ) : propostas.length === 0 ? (
        <p className="text-gray-600">{t("nenhumaProposta")}</p>
      ) : (
        <ul className="space-y-4">
          {propostas.map((p) => (
            <li key={p.id} className="border p-4 rounded bg-white shadow">
              <p>
                <strong>{t("carga")}:</strong>{" "}
                {p.carga?.origem} → {p.carga?.destino}
              </p>
              <p>
                <strong>{t("valor")}:</strong> €{p.valor.toFixed(2)}
              </p>
              <p>
                <strong>{t("mensagem")}:</strong> {p.mensagem || t("semMensagem")}
              </p>
              <p>
                <strong>{t("status")}:</strong>{" "}
                <span className={`font-semibold ${
                  p.status === "ACEITA"
                    ? "text-green-600"
                    : p.status === "RECUSADA"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}>
                  {t(p.status.toLowerCase())}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
