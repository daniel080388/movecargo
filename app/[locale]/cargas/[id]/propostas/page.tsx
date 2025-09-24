// deduplicated - file now contains only a single component implementation
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { getApiBase } from "@/lib/clientApiBase";

export default function PropostasDaCargaPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const t = useTranslations("Propostas");

  const [propostas, setPropostas] = useState<any[]>([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPropostas = async () => {
    if (!id || !token) return;

    setLoading(true);
    try {
      const res = await fetch(getApiBase() + `/api/cargas/${id}/propostas`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const txt = await res.text();
        let errText = txt;
        try {
          const parsed = JSON.parse(txt);
          errText = parsed?.error || JSON.stringify(parsed);
        } catch {}
        setErro(errText || t("erroAoBuscar"));
      } else {
        const data = await res.json();
        setPropostas(data.propostas || []);
      }
    } catch {
      setErro(t("erroServidor"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropostas();
  }, [id, token]);

  const atualizarStatus = async (
    propostaId: number,
    acao: "aceitar" | "recusar"
  ) => {
    setLoading(true);
    try {
      const res = await fetch(getApiBase() + `/api/propostas/${propostaId}/${acao}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const txt = await res.text();
        let errText = txt;
        try {
          const parsed = JSON.parse(txt);
          errText = parsed?.error || JSON.stringify(parsed);
        } catch {}
        alert(errText || t("erroAoAtualizar"));
      } else {
        await fetchPropostas();
      }
    } catch {
      alert(t("erroServidor"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-8">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">
          {t("titulo")}
        </h1>

        {erro && <p className="text-red-500">{erro}</p>}

        {propostas.length === 0 && !erro ? (
          <p className="text-gray-600">{t("nenhumaProposta")}</p>
        ) : (
          <ul className="space-y-4">
            {propostas.map((p) => (
              <li
                key={p.id}
                data-testid={`proposta-item-${p.id}`}
                className="border p-4 rounded-md shadow-sm bg-gray-50"
              >
                <div className="mb-2">
                  <strong>{t("transportadora")}:</strong>{" "}
                  {p.motorista?.name || t("desconhecido")} {
                    p.contactsReleased ? (
                      <span>({p.motorista?.email || t("semEmail")})</span>
                    ) : (
                      <span className="text-gray-500">({t("contatosLiberados")})</span>
                    )
                  }
                </div>
                <div>
                  <strong>{t("valor")}:</strong> €{Number(p.valor).toFixed(2)}
                </div>
                <div>
                  <strong>{t("mensagem")}:</strong>{" "}
                  {p.mensagem || t("semMensagem")}
                </div>
                <div className="mb-2">
                  <strong>{t("status")}:</strong>{" "}
                  <span
                    data-testid={`proposta-status-${p.id}`}
                    className={`font-bold ${
                      p.status === "ACEITA"
                        ? "text-green-600"
                        : p.status === "RECUSADA"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {t(p.status.toLowerCase())}
                  </span>
                </div>

                {p.status === "PENDENTE" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => atualizarStatus(p.id, "aceitar")}
                      disabled={loading}
                      className="px-4 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {t("aceitar")}
                    </button>
                    <button
                      onClick={() => atualizarStatus(p.id, "recusar")}
                      disabled={loading}
                      className="px-4 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {t("recusar")}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
