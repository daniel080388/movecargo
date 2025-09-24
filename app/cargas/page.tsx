import { redirect } from "next/navigation";
import { defaultLocale } from "../../i18n";

export default function CargasRedirectPage() {
  // Redirect /cargas to the localized page (e.g. /pt/cargas)
  redirect(`/${defaultLocale}/cargas`);
}
