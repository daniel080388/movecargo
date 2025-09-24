"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import Avaliar from '@/app/[locale]/components/Avaliar';

export default function DetalhesCargaPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const t = useTranslations("DetalhesCarga");

  const [carga, setCarga] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const fetchCarga = async () => {
    if (!token || !id) return;

    try {
      const res = await fetch(`/api/cargas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || t("erroAoBuscar"));
      } else {
        setCarga(data.carga);
      }
    } catch {
      setErro(t("erroServidor"));
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (propostaId: number, acao: "aceitar" | "recusar") => {
    try {
      const res = await fetch(`/api/propostas/${propostaId}/${acao}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) fetchCarga();
    } catch {
      alert(t("erroServidor"));
    }
  };

  useEffect(() => {
    fetchCarga();
  }, [id, token]);

  if (loading) return <p className="p-6">{t("carregando")}</p>;
  if (erro) return <p className="p-6 text-red-600">{erro}</p>;
  if (!carga) return null;

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">{t("titulo")}</h1>

      <div className="bg-white p-4 rounded shadow mb-6 border">
        <p><strong>{t("origem")}:</strong> {carga.origem}</p>
        <p><strong>{t("destino")}:</strong> {carga.destino}</p>
        <p><strong>{t("tipoCaminhao")}:</strong> {carga.tipoCaminhao}</p>
        <p><strong>{t("peso")}:</strong> {carga.peso} kg</p>
        <p><strong>{t("datas")}:</strong> {carga.dataInicio} → {carga.dataFim}</p>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-2">{t("propostas")}</h2>

      {carga.propostas.length === 0 ? (
        <p className="text-gray-600">{t("nenhumaProposta")}</p>
      ) : (
        <ul className="space-y-4">
          {carga.propostas.map((p: any) => (
            <li key={p.id} className="border p-4 rounded bg-gray-50">
              <p>
                <strong>{t("transportadora")}:</strong> {p.motorista?.name || t("desconhecido")} {' '}
                {p.contactsReleased ? (
                  <span>({p.motorista?.email || t("semEmail")})</span>
                ) : (
                  <span className="text-gray-500">({t("contatosLiberados")})</span>
                )}
              </p>
              <p><strong>{t("valor")}:</strong> €{p.valor.toFixed(2)}</p>
              <p><strong>{t("mensagem")}:</strong> {p.mensagem || t("semMensagem")}</p>
              <p>
                <strong>{t("status")}:</strong>{" "}
                <span className={`font-semibold ${
                  p.status === "ACEITA" ? "text-green-600" :
                  p.status === "RECUSADA" ? "text-red-600" : "text-yellow-600"
                }`}>
                  {t(p.status.toLowerCase())}
                </span>
              </p>

              {p.status === "PENDENTE" && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => atualizarStatus(p.id, "aceitar")}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    {t("aceitar")}
                  </button>
                  <button
                    onClick={() => atualizarStatus(p.id, "recusar")}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    {t("recusar")}
                  </button>
                </div>
              )}

              {p.status === "ACEITA" && (
                <div className="mt-3">
                  {/* permitir avaliar transportadora */}
                  {/* @ts-ignore */}
                  <Avaliar toUserId={p.motorista?.id} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
