import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n";

export default function RootRedirect() {
  // Redireciona a raiz "/" para a home localizada por omissão
  redirect(`/${defaultLocale}`);
}
