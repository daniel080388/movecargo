import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['pt', 'en', 'es', 'de'],  // por exemplo
  defaultLocale: 'pt',
});
