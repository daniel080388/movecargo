"use client";

import { useTranslations } from "next-intl";

export default function MotoristaDashboard() {
  const t = useTranslations("MotoristaDashboard");

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4 text-green-600">
        {t("bemVindo")}
      </h1>
      <p>{t("verCargas")}</p>
    </main>
  );
}

