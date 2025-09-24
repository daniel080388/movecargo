"use client";

import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "./ThemeToggle.client";
import dynamic from 'next/dynamic'
const AuthCta = dynamic(() => import('./AuthCta.client'), { ssr: false })
import { Button } from "./ui/Button";
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

export default function Header() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const onChangeLocale: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const newLocale = e.target.value
    if (!pathname || !currentLocale) return
    // Replace only the first segment '/{locale}'
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`)
    router.push(newPath)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-default bg-card/80 backdrop-blur">
      <div className="container-page flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-primary text-primary-foreground grid place-items-center font-bold">MC</div>
          <h1 className="text-lg font-semibold">MoveCargo</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Language switcher */}
          <select
            aria-label="Idioma"
            className="border rounded px-2 py-1 text-sm bg-background"
            defaultValue={currentLocale || 'pt'}
            onChange={onChangeLocale}
          >
            <option value="pt">PT</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="fr">FR</option>
            <option value="de">DE</option>
          </select>
          {user ? (
            <Button id="logout" onClick={logout} variant="outline">Sair</Button>
          ) : (
            <AuthCta />
          )}
        </div>
      </div>
    </header>
  );
}
