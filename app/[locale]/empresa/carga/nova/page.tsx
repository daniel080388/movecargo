// app/[locale]/empresa/carga/nova/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBase } from "@/lib/clientApiBase";

export default function NovaCargaPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    origem: "",
    destino: "",
    tipoCaminhao: "",
    peso: "",
    largura: "",
    altura: "",
    comprimento: "",
    meiaCarga: false,
    multiDestino: false,
    expresso: false,
    dataInicio: "",
    dataFim: "",
    observacoes: "",
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiBase() + "/api/cargas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const txt = await res.text();
        let errText = txt;
        try {
          const parsed = JSON.parse(txt);
          errText = parsed?.error || JSON.stringify(parsed);
        } catch {}
        alert("Erro: " + (errText || "Erro ao publicar carga"));
        return;
      }

      alert("Carga publicada com sucesso!");
      router.push("/empresa/dashboard");
    } catch (err) {
      alert("Erro ao comunicar com servidor.");
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-10">
      <div className="bg-white shadow rounded-lg p-6 sm:p-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-6 text-blue-700">Publicar Nova Carga</h1>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div>
            <label className="block text-sm font-medium">Origem</label>
            <input name="origem" value={form.origem} onChange={handleChange} required className="input w-full" />
          </div>

          <div>
            <label className="block text-sm font-medium">Destino</label>
            <input name="destino" value={form.destino} onChange={handleChange} required className="input w-full" />
          </div>

          <div>
            <label className="block text-sm font-medium">Tipo de Camião</label>
            <select name="tipoCaminhao" value={form.tipoCaminhao} onChange={handleChange} required className="input w-full">
              <option value="">Selecione...</option>
              <option>Camião completo</option>
              <option>Meio camião</option>
              <option>Frigorífico</option>
              <option>Caixa aberta</option>
              <option>Lona/cortinado</option>
              <option>Cisterna líquidos</option>
              <option>Cisterna pó/granel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Peso (kg)</label>
            <input type="number" name="peso" value={form.peso} onChange={handleChange} required className="input w-full" placeholder="Ex: 1800" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Largura (m)</label>
              <input type="number" name="largura" value={form.largura} onChange={handleChange} className="input w-full" placeholder="Ex: 2.5" />
            </div>
            <div>
              <label className="block text-sm font-medium">Altura (m)</label>
              <input type="number" name="altura" value={form.altura} onChange={handleChange} className="input w-full" placeholder="Ex: 3.2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Comprimento (m)</label>
              <input type="number" name="comprimento" value={form.comprimento} onChange={handleChange} className="input w-full" placeholder="Ex: 8.4" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="meiaCarga" checked={form.meiaCarga} onChange={handleChange} />
              Meia carga
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="multiDestino" checked={form.multiDestino} onChange={handleChange} />
              Múltiplos destinos
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="expresso" checked={form.expresso} onChange={handleChange} />
              Expresso
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Data de Início</label>
              <input type="date" name="dataInicio" value={form.dataInicio} onChange={handleChange} required className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium">Data de Fim</label>
              <input type="date" name="dataFim" value={form.dataFim} onChange={handleChange} required className="input w-full" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Observações</label>
            <textarea name="observacoes" value={form.observacoes} onChange={handleChange} className="input w-full" />
          </div>

          <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700">
            Publicar
          </button>
        </form>
      </div>
    </main>
  );
}
