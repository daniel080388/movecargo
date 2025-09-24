// i18n.ts
import { getRequestConfig } from "next-intl/server";
import messages from "./messages/index";

export const locales = ["pt", "en", "es", "fr", "de"] as const;
export const defaultLocale = "pt";

export default getRequestConfig(async ({ locale }) => {
  const msgs = messages[locale as string] || messages[defaultLocale];
  return { locale: locale || defaultLocale, messages: msgs };
});
