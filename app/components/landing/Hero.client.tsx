"use client";
import { LinkButton } from "@/app/components/ui/Button";
import { useLocale } from "next-intl";

export default function LandingHero() {
  const locale = useLocale() || 'pt';

  return (
    <section className="relative text-white pt-28 pb-16 px-6 overflow-hidden">
      <div className="absolute inset-0 hero-bg" aria-hidden />
      <div className="relative z-10 container-page">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Logística inteligente para a Europa</h1>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Ligue expedidores e transportadoras em segundos. Otimize cargas e rotas por toda a Europa.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-3">
            <LinkButton href={`/${locale}/registrar`} variant="outline" size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
              Sou Expedidor
            </LinkButton>
            <LinkButton href={`/${locale}/registrar`} variant="primary" size="lg">
              Sou Transportadora
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
