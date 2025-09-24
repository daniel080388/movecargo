'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useUpdateSettings } from '@/lib/hooks/useUpdateSettings'

export function LanguageSelector({ initialLocale }: { initialLocale: string }) {
  const [locale, setLocale] = useState(initialLocale)
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()
  const { update, loading } = useUpdateSettings()

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value
    setLocale(newLocale)

    await update({ defaultLocale: newLocale })

    if (newLocale !== currentLocale) {
      const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`)
      router.push(newPath)
    }
  }

  return (
    <div>
      <label htmlFor="idioma" className="block mb-1">
        Idioma padrão:
      </label>
      <select
        id="idioma"
        value={locale}
        onChange={handleChange}
        disabled={loading}
        className="border p-1"
      >
        <option value="pt">Português</option>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
        <option value="de">Deutsch</option>
      </select>
    </div>
  )
}
