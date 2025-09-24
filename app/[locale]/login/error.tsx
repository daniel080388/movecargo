"use client";

export default function LoginError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="card p-6 max-w-md text-center">
        <h1 className="text-xl font-semibold mb-2">Ocorreu um erro ao carregar a página de login</h1>
        <p className="text-sm text-muted mb-4 break-all">{error?.message || 'Erro inesperado'}</p>
        <div className="flex gap-2 justify-center">
          <button className="btn" onClick={() => reset()}>Tentar novamente</button>
          <button className="btn" onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      </div>
    </main>
  );
}
