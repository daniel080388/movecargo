// app/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';

export const locales = ['pt', 'en', 'es', 'de', 'fr'];
export const defaultLocale = 'pt';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = requestLocale && hasLocale(locales, requestLocale)
    ? requestLocale
    : defaultLocale;

  let messages;
  try {
    messages = (await import(`./${locale}.json`)).default;
  } catch (error) {
    notFound(); // se não encontrar o ficheiro de mensagens
  }

  return {
    locale,
    messages,
  };
});
