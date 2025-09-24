"use client";

import React, { useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import MapMini from "@/components/MapMini.client";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

type Destino = { cidade: string; ordem: number; latitude?: number; longitude?: number };

export default function EmpresaPublicarPage() {
  const { token } = useAuth();
  const t = useTranslations("EmpresaPublicar");
  const tn = useTranslations("NovaCarga");

  const [tipoCaminhao, setTipoCaminhao] = useState("");
  const [meiaCarga, setMeiaCarga] = useState(false);
  const [expresso, setExpresso] = useState(false);
  const [pesoKg, setPesoKg] = useState<number | "">("");
  const [dimL, setDimL] = useState<number | "">("");
  const [dimW, setDimW] = useState<number | "">("");
  const [dimH, setDimH] = useState<number | "">("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [origem, setOrigem] = useState("");
  const [destinos, setDestinos] = useState<Destino[]>([{ cidade: "", ordem: 1 }]);
  const [descricao, setDescricao] = useState("");
  const [titulo, setTitulo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => !!token && origem.trim() && destinos.some(d => d.cidade.trim()), [token, origem, destinos]);

  const markers = useMemo(() => {
    const mk = [] as { lng: number; lat: number; color?: string; popup?: string }[];
    return mk;
  }, [origem, destinos]);

  function addDestino() {
    setDestinos((prev) => [...prev, { cidade: "", ordem: prev.length + 1 }]);
  }

  function updateDestino(idx: number, value: string) {
    setDestinos((prev) => prev.map((d, i) => (i === idx ? { ...d, cidade: value } : d)));
  }

  function removeDestino(idx: number) {
    setDestinos((prev) => prev.filter((_, i) => i !== idx).map((d, i) => ({ ...d, ordem: i + 1 })));
  }

  async function onSubmit() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const body: any = {
        origem,
        titulo: titulo || undefined,
        descricao,
        tipoCaminhao: tipoCaminhao || undefined,
        pesoKg: pesoKg === "" ? undefined : Number(pesoKg),
        comprimento: dimL === "" ? undefined : Number(dimL),
        largura: dimW === "" ? undefined : Number(dimW),
        altura: dimH === "" ? undefined : Number(dimH),
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        expresso,
        meiaCarga,
        multiDestino: destinos.length > 1,
        destinos: destinos
          .filter((d) => d.cidade.trim())
          .map((d, i) => ({ cidade: d.cidade.trim(), ordem: i + 1 })),
      };

      const res = await fetch("/api/cargas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("errorGeneric"));
      }

      setSuccess(t("successPublish"));
      setTitulo("");
      setDescricao("");
      setTipoCaminhao("");
      setPesoKg("");
      setDimL("");
      setDimW("");
      setDimH("");
      setDataInicio("");
      setDataFim("");
      setOrigem("");
      setDestinos([{ cidade: "", ordem: 1 }]);
      setExpresso(false);
      setMeiaCarga(false);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout title={t("title")}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-lg font-semibold mb-4">{t("detailsTitle")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">{t("optionalTitleLabel")}</label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={t("optionalTitlePlaceholder")} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{tn("tipoCaminhao")}</label>
              <Select value={tipoCaminhao} onChange={(e) => setTipoCaminhao(e.target.value)}>
                <option value="">{tn("selecione")}</option>
                <option value="van_3.5t">Furgão (até 3.5t)</option>
                <option value="camiao_7.5t">Camião 7.5t</option>
                <option value="camiao_13.6m">Camião 13.6m</option>
                <option value="frigorifico">Frigorífico</option>
                <option value="plataforma">Plataforma</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t("loadTypeLabel")}</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  className={`flex-1 border rounded-md p-3 text-sm ${!meiaCarga ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                  onClick={() => setMeiaCarga(false)}
                >
                  {t("fullLoad")}
                </button>
                <button
                  type="button"
                  className={`flex-1 border rounded-md p-3 text-sm ${meiaCarga ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                  onClick={() => setMeiaCarga(true)}
                >
                  {tn("meiaCarga")}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{tn("peso")}</label>
              <Input type="number" value={pesoKg as any} onChange={(e) => setPesoKg(e.target.value ? Number(e.target.value) : "")} placeholder="Ex.: 5000" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t("dimensionsCm")}</label>
              <div className="flex gap-2">
                <Input type="number" value={dimL as any} onChange={(e) => setDimL(e.target.value ? Number(e.target.value) : "") } placeholder="C" />
                <Input type="number" value={dimW as any} onChange={(e) => setDimW(e.target.value ? Number(e.target.value) : "") } placeholder="L" />
                <Input type="number" value={dimH as any} onChange={(e) => setDimH(e.target.value ? Number(e.target.value) : "") } placeholder="A" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t("loadingPeriod")}</label>
              <div className="flex gap-2">
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t("urgency")}</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  className={`flex-1 border rounded-md p-3 text-sm ${!expresso ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                  onClick={() => setExpresso(false)}
                >
                  {t("standard")}
                </button>
                <button
                  type="button"
                  className={`flex-1 border rounded-md p-3 text-sm ${expresso ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                  onClick={() => setExpresso(true)}
                >
                  {tn("expresso")}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">{t("locationsTitle")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">{tn("origem")}</label>
              <Input value={origem} onChange={(e) => setOrigem(e.target.value)} placeholder={t("originPlaceholder")} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t("destinationsLabel")}</label>
              <div className="space-y-2">
                {destinos.map((d, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={d.cidade}
                      onChange={(e) => updateDestino(idx, e.target.value)}
                      placeholder={`${t("destinationPlaceholder")} ${idx + 1}`}
                    />
                    {destinos.length > 1 && (
                      <button onClick={() => removeDestino(idx)} className="text-gray-500 hover:text-red-600 text-sm">{t("remove")}</button>
                    )}
                  </div>
                ))}
                <button onClick={addDestino} className="text-blue-600 hover:text-blue-800 text-sm">{t("addDestination")}</button>
              </div>
            </div>
            <div className="md:col-span-2">
              <MapMini markers={markers} height={260} />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-md font-semibold mb-2">{t("additionalInfoTitle")}</h3>
            <Textarea rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder={t("descriptionPlaceholder")} />
          </div>
        </section>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline">{t("saveDraft")}</Button>
        <Button onClick={onSubmit} disabled={!canSubmit || loading}>{loading ? t("publishing") : t("publish")}</Button>
      </div>

      {error && <div className="mt-4 p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>}
      {success && <div className="mt-4 p-3 rounded bg-green-50 text-green-700 text-sm">{success}</div>}
    </DashboardLayout>
  );
}
