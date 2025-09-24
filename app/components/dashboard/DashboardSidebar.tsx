"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type Item = {
  href: (locale: string) => string;
  label: string;
  key: string;
};

const items: Item[] = [
  { key: "empresa-dashboard", label: "Empresa · Dashboard", href: (l) => `/${l}/empresa/dashboard` },
  { key: "empresa-publicar", label: "Empresa · Publicar Carga", href: (l) => `/${l}/empresa/publicar` },
  { key: "transportadora-dashboard", label: "Transportadora · Dashboard", href: (l) => `/${l}/transportadora/dashboard` },
  { key: "cargas", label: "Marketplace de Cargas", href: (l) => `/${l}/cargas` },
];

function getLocaleFromPath(pathname: string | null): string {
  if (!pathname) return "pt";
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg?.length === 2 ? seg : "pt";
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  return (
    <aside className="bg-white shadow-md w-64 flex-shrink-0 flex flex-col border-r border-gray-100">
      <div className="p-4 border-b flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold">M</div>
        <span className="font-bold text-lg">MoveCargo</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-2 space-y-1">
          {items.map((it) => {
            const href = it.href(locale);
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={it.key}
                href={href}
                className={[
                  "block px-4 py-3 rounded-r-lg text-sm",
                  active
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                    : "text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                {it.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="p-4 border-t text-xs text-gray-500">
        © {new Date().getFullYear()} MoveCargo
      </div>
    </aside>
  );
}
