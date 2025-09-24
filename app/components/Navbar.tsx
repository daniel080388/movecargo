"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const t = useTranslations("HomePage");
  const pathname = usePathname();

  // Detecta o locale atual (primeiro segmento da URL)
  const locale = pathname?.split("/")[1] || "pt";

  return (
    <nav className="bg-white shadow-md px-6 py-3 flex justify-between items-center">
      <h1 className="text-xl font-bold text-blue-600">MoveCargo</h1>

      <ul className="flex gap-6">
        <li>
          <Link href={`/${locale}`} className="hover:text-blue-500">
            {t("inicio")}
          </Link>
        </li>
        <li>
          <Link href={`/${locale}/empresa/carga/nova`} className="hover:text-blue-500">
            {t("publicar")}
          </Link>
        </li>
        <li>
          <Link href={`/${locale}/cargas`} className="hover:text-blue-500">
            {t("procurar")}
          </Link>
        </li>
        <li>
          <Link href={`/${locale}/transportadora/propostas`} className="hover:text-blue-500">
            {t("propostas")}
          </Link>
        </li>
        <li>
          <Link href={`/${locale}/login`} className="hover:text-blue-500">
            {t("entrar")}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
