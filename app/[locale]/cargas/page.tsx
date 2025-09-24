"use client";
import { useEffect, useMemo, useState } from "react";
import CargaCard, { Carga } from "@/app/components/CargaCard";
import Input from "@/app/components/ui/Input";
import Select from "@/app/components/ui/Select";
import { Button } from "@/app/components/ui/Button";

export default function CargasPage() {
  const [cidade, setCidade] = useState("");
  const [raio, setRaio] = useState(100);
  const [tipo, setTipo] = useState("");
  const [items, setItems] = useState<Carga[]>([]);
  const [loading, setLoading] = useState(false);
  const canSearch = useMemo(() => cidade.trim().length > 0 && raio > 0, [cidade, raio]);

  async function pesquisar() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cidade) params.set("cidade", cidade);
      if (raio) params.set("raioKm", String(raio));
      if (tipo) params.set("tipoCaminhao", tipo);
      const res = await fetch(`/api/cargas?${params.toString()}`);
      const data = await res.json();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // first load can be empty; user chooses cidade
  }, []);

  return (
    <div className="space-y-6">
      <div className="card p-4">
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

      {items.length === 0 ? (
        <div className="text-center text-muted">Sem resultados. Defina uma cidade e pesquise.</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((c) => (
            <CargaCard key={c.id} carga={c} />
          ))}
        </div>
      )}
    </div>
  );
}
 
