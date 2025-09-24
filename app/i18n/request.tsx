"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

export default function HomePage() {
  const t = useTranslations("HomePage");
  const router = useRouter();
  const pathname = usePathname();

  // Função para trocar idioma
  function changeLanguage(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = e.target.value;
    const segments = pathname.split("/");
    segments[1] = newLocale; // troca o [locale] no path
    router.push(segments.join("/"));
  }

  return (
    <main>
      {/* 🌍 Selector de idioma */}
      <div className="bg-gray-100 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end">
          <select
            id="language-selector"
            defaultValue="pt"
            onChange={changeLanguage}
            className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pt">Português</option>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
      </div>

      {/* 🚚 Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <img
                  src="/static/images/logo-truck.png"
                  alt="MoveCargo Logo"
                  className="h-10 w-10"
                />
                <span className="ml-2 text-xl font-bold text-blue-600">MoveCargo</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a
                  href="#"
                  className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  {t("inicio")}
                </a>
                <a
                  href="#"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  {t("publicar")}
                </a>
                <a
                  href="#"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  {t("procurar")}
                </a>
                <a
                  href="#"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  {t("propostas")}
                </a>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">{t("entrar")}</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div className="mb-8 lg:mb-0">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-4">{t("heroTitulo")}</h1>
              <p className="text-xl text-blue-100 mb-8">{t("heroTexto")}</p>
              <div className="flex space-x-4">
                <button className="bg-white text-blue-700 px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-50">{t("publicar")}</button>
                <button className="bg-blue-600 hover:bg-blue-800 text-white px-6 py-3 rounded-md text-lg font-medium">{t("procurar")}</button>
              </div>
            </div>
            <div>
              <img src="/static/images/truck-hero.jpg" alt="Caminhão em estrada" className="rounded-lg shadow-xl" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
