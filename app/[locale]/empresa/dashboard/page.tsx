"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MapMini from "@/components/MapMini.client";
import MapaCargas from "@/components/MapaCargas";
import { getApiBase } from "@/lib/clientApiBase";
import { useTranslations } from "next-intl";

type Carga = {
  id: number;
  origem: string;
  destinos?: { cidade: string }[];
  tipoCaminhao?: string;
  pesoKg?: number;
  createdAt?: string;
};

function getLocaleFromPath(pathname: string | null): string {
  if (!pathname) return "pt";
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg?.length === 2 ? seg : "pt";
}

export default function EmpresaDashboardPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { token } = useAuth();
  const t = useTranslations("EmpresaOverview");

  const [recent, setRecent] = useState<Carga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(getApiBase() + "/api/empresa/cargas", { headers });
        const text = await res.text();
        if (!res.ok) {
          try {
            const j = JSON.parse(text);
            setError(j?.error || t("activity.error"));
          } catch {
            setError(t("activity.error"));
          }
          setRecent([]);
        } else {
          try {
            const data = JSON.parse(text);
            setRecent(Array.isArray(data) ? data.slice(0, 5) : []);
          } catch {
            setRecent([]);
          }
        }
      } catch (e) {
  setError(t("activity.error"));
        setRecent([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  const markers = useMemo(() => [] as { lng: number; lat: number; color?: string; popup?: string }[], []);

  return (
  <DashboardLayout title={t("title")}>
      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Link href={`/${locale}/empresa/publicar`} className="block p-4 rounded-lg border shadow-sm hover:shadow bg-white">
          <div className="text-sm text-gray-500">{t("quick.sectionLabel")}</div>
          <div className="text-lg font-semibold text-blue-700">{t("quick.publish.title")}</div>
          <div className="mt-2 text-sm text-gray-600">{t("quick.publish.subtitle")}</div>
        </Link>
        <Link href={`/${locale}/cargas`} className="block p-4 rounded-lg border shadow-sm hover:shadow bg-white">
          <div className="text-sm text-gray-500">{t("quick.explore.section")}</div>
          <div className="text-lg font-semibold text-blue-700">{t("quick.explore.title")}</div>
          <div className="mt-2 text-sm text-gray-600">{t("quick.explore.subtitle")}</div>
        </Link>
        <Link href={`/${locale}/empresa/perfil`} className="block p-4 rounded-lg border shadow-sm hover:shadow bg-white">
          <div className="text-sm text-gray-500">{t("quick.account.section")}</div>
          <div className="text-lg font-semibold text-blue-700">{t("quick.account.title")}</div>
          <div className="mt-2 text-sm text-gray-600">{t("quick.account.subtitle")}</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <section className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">{t("activity.title")}</h2>
              <Link className="text-sm text-blue-700 hover:underline" href={`/${locale}/empresa/carga`}>{t("activity.viewAll")}</Link>
            </div>
            {loading && <div className="text-sm text-gray-600">{t("activity.loading")}</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}
            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2 pr-3">{t("activity.columns.route")}</th>
                      <th className="py-2 pr-3">{t("activity.columns.type")}</th>
                      <th className="py-2 pr-3">{t("activity.columns.weight")}</th>
                      <th className="py-2 pr-3">{t("activity.columns.createdAt")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((c) => (
                      <tr key={c.id} className="border-b last:border-none">
                        <td className="py-2 pr-3">{c.origem} → {c.destinos?.[0]?.cidade || "—"}</td>
                        <td className="py-2 pr-3">{c.tipoCaminhao || "—"}</td>
                        <td className="py-2 pr-3">{c.pesoKg ?? "—"} kg</td>
                        <td className="py-2 pr-3">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                    {recent.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-500">{t("activity.empty")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Map section */}
        <section>
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3">{t("map.title")}</h2>
            <MapMini markers={markers} height={280} />
          </div>
        </section>
      </div>

      {/* Recommended/Marketplace */}
      <section className="mt-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t("marketplace.title")}</h2>
            <Link className="text-sm text-blue-700 hover:underline" href={`/${locale}/cargas`}>{t("marketplace.explore")}</Link>
          </div>
          <MapaCargas />
        </div>
      </section>
    </DashboardLayout>
  );
}
