"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { getApiBase } from "@/lib/clientApiBase";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import Input from "@/app/components/ui/Input";
import Textarea from "@/app/components/ui/Textarea";
import { Button } from "@/app/components/ui/Button";

export default function FazerPropostaPage() {
  const params = useParams<{ locale: string; id: string }>();
  const locale = (params?.locale as string) || "pt";
  const id = params?.id as string;
  const router = useRouter();
  const t = useTranslations("TransportadoraDashboard");
  const tDetalhes = useTranslations("DetalhesCarga");
  const { token } = useAuth();

  const [valor, setValor] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState<string>("");
  const [sucesso, setSucesso] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [carga, setCarga] = useState<any | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(getApiBase() + `/api/cargas/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (active) setCarga(data);
      } catch {}
    }
    if (id) load();
    return () => { active = false };
  }, [id]);

  // validation
  const valorNumber = useMemo(() => Number.parseFloat(valor), [valor]);
  const canSubmit = useMemo(() => Number.isFinite(valorNumber) && valorNumber > 0 && !!token && !loading, [valorNumber, token, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }
    if (!Number.isFinite(valorNumber) || valorNumber <= 0) {
      setErro("Valor inválido");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(getApiBase() + `/api/cargas/${id}/propostas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ valor: valorNumber, mensagem }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setErro((data && (data.error || data.details)) || t("erroEnviarProposta"));
        return;
      }

      setSucesso(t("propostaEnviada"));
      setValor("");
      setMensagem("");
      // redirect to transportadora proposals history after short delay
      setTimeout(() => router.push(`/${locale}/transportadora/propostas`), 900);
    } catch (err) {
      setErro(t("erroEnviarProposta"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t("enviarProposta")}</CardTitle>
        </CardHeader>
        <CardContent>
          {carga ? (
            <div className="mb-4 text-sm text-muted">
              <div className="font-medium text-[var(--foreground)]">{carga.titulo || `${carga.origem}`}</div>
              <div>
                <span className="mr-2">{tDetalhes("origem")}: {carga.origem}</span>
                {Array.isArray(carga.destinos) && carga.destinos.length > 0 ? (
                  <span>→ {tDetalhes("destino")}s: {carga.destinos.map((d: any) => d.cidade).join(', ')}</span>
                ) : null}
              </div>
              {carga.tipoCaminhao || carga.pesoKg ? (
                <div>
                  {carga.tipoCaminhao ? <span className="mr-2">{tDetalhes("tipoCaminhao")}: {carga.tipoCaminhao}</span> : null}
                  {carga.pesoKg ? <span>{tDetalhes("peso")}: {carga.pesoKg} kg</span> : null}
                </div>
              ) : null}
            </div>
          ) : null}
          {erro ? (
            <div className="mb-4 text-sm text-red-600" role="alert">{erro}</div>
          ) : null}
          {sucesso ? (
            <div className="mb-4 text-sm text-green-700" role="status">{sucesso}</div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1">{t("labelValor")}</label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder={t("placeholderValor")}
                data-testid="input-valor"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-1">{t("labelMensagem")}</label>
              <Textarea
                rows={3}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder=""
                data-testid="input-mensagem"
              />
            </div>

            <Button type="submit" disabled={!canSubmit} data-testid="btn-enviar">
              {loading ? "…" : t("enviar")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
