"use client";

import { useTranslations } from "next-intl";

export default function EmpresaDashboard() {
  const t = useTranslations("EmpresaDashboard");

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4 text-blue-600">
        {t("bemVindo")}
      </h1>
      <p>{t("logout")}</p>
    </main>
  );
}
