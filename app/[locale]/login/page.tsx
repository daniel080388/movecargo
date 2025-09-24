"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import Input from "@/app/components/ui/Input";
import { Button, LinkButton } from "@/app/components/ui/Button";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const emailValid = useMemo(() => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email), [email]);
  const canSubmit = emailValid && password.length >= 6 && !loading;
  const params = useParams<{ locale: string }>();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setServerError(null);
    try {
      await login(email, password);
      const locale = params?.locale || "pt";
      // Redirect based on role from stored token/user via /api/auth/me
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const meRes = await fetch(`${window.location.origin}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (meRes.ok) {
            const me = await meRes.json();
            const role = (me?.role || '').toString().toLowerCase();
            if (role === 'empresa') {
              router.push(`/${locale}/empresa/dashboard`);
              return;
            }
            if (role === 'motorista' || role === 'transportadora') {
              router.push(`/${locale}/cargas`);
              return;
            }
          }
        }
      } catch {}
      router.push(`/${locale}`);
    } catch (err: any) {
      console.error(err);
      setServerError(err?.message || "Erro ao entrar. Verifique as credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">Entrar</h1>
        {serverError && (
          <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
            {serverError}
          </div>
        )}
        <label className="block mb-2">
          Email
          <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" type="email" required />
          {!emailValid && email.length > 0 && (
            <span className="text-xs text-red-600">Email inválido</span>
          )}
        </label>
        <label className="block mb-4">
          Senha
          <Input value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" type="password" required />
          {password.length > 0 && password.length < 6 && (
            <span className="text-xs text-red-600">Mínimo 6 caracteres</span>
          )}
        </label>
        <div className="flex items-center justify-between gap-3">
          <Button type="submit" disabled={!canSubmit} className="flex-1">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          <LinkButton href={`/${params?.locale || 'pt'}/registrar`} variant="outline">Criar conta</LinkButton>
        </div>
      </form>
    </main>
  );
}
