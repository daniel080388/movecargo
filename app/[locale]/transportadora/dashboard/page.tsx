"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import axios from "axios";
import { getApiBase } from "@/lib/clientApiBase";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import MapMini from "@/components/MapMini.client";

export default function TransportadoraDashboard() {
  const t = useTranslations("TransportadoraDashboard");
  const { token, logout } = useAuth();
  const [cargas, setCargas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalCargaId, setModalCargaId] = useState<number | null>(null);
  const [valor, setValor] = useState("");
  const [mensagem, setMensagem] = useState("");
  // filtros de pesquisa
  const [cidade, setCidade] = useState("");
  const [raio, setRaio] = useState(100);
  const [tipo, setTipo] = useState("");
  const canSearch = useMemo(() => cidade.trim().length > 0 && raio > 0, [cidade, raio]);

  useEffect(() => {
    if (!token) return;

    const fetchCargas = async () => {
      try {
        // usa o endpoint público com filtros calculados
        const params = new URLSearchParams();
        if (cidade) params.set("cidade", cidade);
        if (raio) params.set("raioKm", String(raio));
        if (tipo) params.set("tipoCaminhao", tipo);
        const res = await fetch(`/api/cargas?${params.toString()}`);
        const data = await res.json();
        setCargas(data);
      } catch (err) {
        console.error("Erro ao buscar cargas:", err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    // carrega inicial só se tiver cidade predefinida
    if (cidade) {
      fetchCargas();
    } else {
      setLoading(false);
    }
  }, [token, logout]);

  async function pesquisar() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cidade) params.set("cidade", cidade);
      if (raio) params.set("raioKm", String(raio));
      if (tipo) params.set("tipoCaminhao", tipo);
      const res = await fetch(`/api/cargas?${params.toString()}`);
      const data = await res.json();
      setCargas(data);
    } finally {
      setLoading(false);
    }
  }

  const enviarProposta = async () => {
    if (!valor || !modalCargaId) return;

    try {
      await axios.post(
        getApiBase() + `/api/cargas/${modalCargaId}/propostas`,
        { valor: parseFloat(valor), mensagem },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(t("propostaEnviada"));
      setModalCargaId(null);
      setValor("");
      setMensagem("");

      const res = await axios.get(getApiBase() + "/api/cargas/proximas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCargas(res.data);
    } catch (err) {
      alert(t("erroEnviarProposta"));
    }
  };

  return (
    <DashboardLayout title={t("titulo")}>
      {/* filtros de pesquisa */}
      <div className="mb-6">
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm text-muted">Cidade</label>
            <Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex.: Lisboa" />
          </div>
          <div>
            <label className="block text-sm text-muted">Raio (km)</label>
            <Input type="number" min={1} max={400} value={raio} onChange={(e) => setRaio(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm text-muted">Tipo de camião</label>
            <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Qualquer</option>
              <option value="camiao_tautliner">Tautliner</option>
              <option value="camiao_porta-pallets">Porta-pallets</option>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={pesquisar} disabled={!canSearch || loading} className="flex-1">{loading ? 'A pesquisar…' : 'Pesquisar'}</Button>
          </div>
        </div>
      </div>

      {/* mapa (placeholder if no token) */}
      <div className="mb-8">
        <MapMini markers={[]} height={280} />
      </div>

      {loading ? (
        <p>{t("carregando")}</p>
      ) : cargas.length === 0 ? (
        <p className="text-gray-600">{t("nenhumaCarga")}</p>
      ) : (
        <div className="space-y-6">
          {cargas.map((carga) => (
            <div
              key={carga.id}
              className="bg-white shadow p-4 rounded-md border border-gray-200"
            >
              <h2 className="text-xl font-semibold text-gray-800">
                {carga.origem} → {carga.destino}
              </h2>
              <p className="text-gray-600 text-sm">
                {t("tipo")}: {carga.tipoCaminhao} | {t("peso")}: {carga.peso} kg |{" "}
                {t("empresa")}: {carga.empresa?.name}
              </p>
              <p className="text-sm">
                {t("expresso")}: {carga.expresso ? t("sim") : t("nao")} |{" "}
                {t("meiaCarga")}: {carga.meiaCarga ? t("sim") : t("nao")} |{" "}
                {t("multiDestino")}: {carga.multiDestino ? t("sim") : t("nao")}
              </p>

              {carga.propostas.length > 0 ? (
                <p className="mt-2 text-sm text-green-700 font-semibold">
                  ✅ {t("jaFezProposta")}
                </p>
              ) : (
                <button
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                  onClick={() => setModalCargaId(carga.id)}
                >
                  {t("fazerProposta")}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de proposta */}
      {modalCargaId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-blue-700">
              {t("enviarProposta")}
            </h2>

            <div className="mb-4">
              <label className="block text-sm mb-1">{t("labelValor")}</label>
              <input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder={t("placeholderValor")}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1">{t("labelMensagem")}</label>
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={3}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalCargaId(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                {t("cancelar")}
              </button>
              <button
                onClick={enviarProposta}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {t("enviar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
