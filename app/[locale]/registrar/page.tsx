"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/app/components/ui/Input";
import Select from "@/app/components/ui/Select";
import { Button, LinkButton } from "@/app/components/ui/Button";

export default function RegistrarPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EMPRESA");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const emailValid = useMemo(() => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email), [email]);
  const passwordScore = useMemo(() => {
    // simple strength check: length>=8, lower, upper, digit, special
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[^\w\s]/.test(password),
    ];
    return checks.reduce((acc, ok) => acc + (ok ? 1 : 0), 0);
  }, [password]);
  const passwordStrongEnough = passwordScore >= 3; // require at least 3 of 5
  const canSubmit = !!name && emailValid && passwordStrongEnough && !loading;
  const router = useRouter();
  const params = useParams<{ locale: string }>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || "Erro ao registrar");
      }
      // vai para a página de login localiza
      const locale = params?.locale || "pt";
      router.push(`/${locale}/login`);
    } catch (err: any) {
      setServerError(err?.message || "Erro ao registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">Criar conta</h1>
        {serverError && (
          <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
            {serverError}
          </div>
        )}
        <label className="block mb-2">
          Nome
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" type="text" required />
        </label>
        <label className="block mb-2">
          Email
          <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" type="email" required />
          {!emailValid && email.length > 0 && (
            <span className="text-xs text-red-600">Email inválido</span>
          )}
        </label>
        <label className="block mb-2">
          Senha
          <Input value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" type="password" required />
          <div className="mt-1 h-1 bg-gray-200 rounded">
            <div
              className="h-1 rounded transition-all"
              style={{
                width: `${(passwordScore / 5) * 100}%`,
                backgroundColor:
                  passwordScore >= 4 ? '#16a34a' : passwordScore >= 3 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <div className="text-xs mt-1 text-gray-600">
            {passwordScore >= 4
              ? 'Senha forte'
              : passwordScore >= 3
              ? 'Senha aceitável (mín. 8, letras maiúsculas/minúsculas e número ou símbolo)'
              : 'Senha fraca (use 8+ caracteres, misture maiúsculas, minúsculas, número e símbolo)'}
          </div>
        </label>
        <label className="block mb-4">
          Tipo de conta
          <Select className="mt-1" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="EMPRESA">Empresa</option>
            <option value="TRANSPORTADORA">Transportadora</option>
          </Select>
        </label>

        <div className="flex items-center justify-between gap-3">
          <Button type="submit" disabled={!canSubmit} className="flex-1">
            {loading ? "A criar…" : "Registrar"}
          </Button>
          <LinkButton href={`/${params?.locale || 'pt'}/login`} variant="outline">Já tenho conta</LinkButton>
        </div>
      </form>
    </main>
  );
}
