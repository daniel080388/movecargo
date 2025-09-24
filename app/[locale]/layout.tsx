// app/[locale]/layout.tsx
import "../globals.css";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { ReactNode } from "react";
import { locales } from "../../i18n";
import messages from "../../messages/index";
import Header from "../components/Header";
import Footer from "../components/Footer";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const msgs = messages[locale] || messages['pt'];

  // Only provide the i18n provider here. The root `app/layout.tsx` is
  // responsible for rendering the outer <html> and <body> elements. If this
  // layout also renders <html>/<body> we get hydration attribute mismatches
  // (lang, body className) between server and client.
  return (
    <NextIntlClientProvider locale={locale} messages={msgs}>
      <Header />
      <main className="container-page py-6">
        {children}
      </main>
      <Footer />
    </NextIntlClientProvider>
  );
}

