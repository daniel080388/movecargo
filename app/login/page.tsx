import { redirect } from "next/navigation";

export default function LoginRedirect() {
  // Redireciona sempre para a rota localizada padrão
  redirect("/pt/login");
}
