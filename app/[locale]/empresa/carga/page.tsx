"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getApiBase } from "@/lib/clientApiBase";

export default function ListarCargasPage() {
  const t = useTranslations("CargasEmpresa");
  const { token } = useAuth();
  const router = useRouter();

  const [cargas, setCargas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const fetchCargas = async () => {
    if (!token) return;

    setLoading(true);
    setErro("");

    try {
      const res = await fetch(getApiBase() + "/api/empresa/cargas", {
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
        setCargas(data.cargas || []);
      }
    } catch {
      setErro(t("erroServidor"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargas();
  }, [token]);

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">
        {t("titulo")}
      </h1>

      {erro && <p className="text-red-600">{erro}</p>}

      {loading ? (
        <p>{t("carregando")}</p>
      ) : cargas.length === 0 ? (
        <p className="text-gray-600">{t("nenhumaCarga")}</p>
      ) : (
        <ul className="space-y-4">
          {cargas.map((carga) => (
            <li
              key={carga.id}
              className="bg-white p-4 rounded shadow border"
            >
              <h2 className="text-lg font-semibold text-gray-800">
                {carga.origem} → {carga.destino}
              </h2>
              <p className="text-sm text-gray-600">
                {t("tipo")}: {carga.tipoCaminhao} | {t("peso")}: {carga.peso} kg
              </p>
              <p className="text-sm text-gray-600">
                {t("dataInicio")}: {carga.dataInicio?.split("T")[0]} | {t("dataFim")}: {carga.dataFim?.split("T")[0]}
              </p>
              <p className="text-sm text-gray-600">
                {t("propostasRecebidas")}: {carga._count?.propostas || 0}
              </p>
              <button
                onClick={() => router.push(`/empresa/carga/${carga.id}`)}
                className="mt-2 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                {t("verDetalhes")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
