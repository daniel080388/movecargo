'use client'

import { LanguageSelector } from '@/components/LanguageSelector'
import NotificationSettings from '@/components/NotificationSettings'
import UserPreferences from '@/components/UserPreferences'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  initialLocale: string
  initialPreferences: any
  initialTheme: string
  initialRadius: number
  initialLatitude: number | string
  initialLongitude: number | string
  role: string
}

export default function ClientConfig({
  initialLocale,
  initialPreferences,
  initialTheme,
  initialRadius,
  initialLatitude,
  initialLongitude,
  role,
}: Props) {
  const isEmpresa = role === 'EMPRESA'
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  return (
    <>
      <section>
        <h2 className="text-lg font-semibold mb-2">Idioma</h2>
        <LanguageSelector initialLocale={initialLocale} />
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Conta</h2>
        <p className="text-sm text-gray-600 mb-2">Eliminar a sua conta é irreversível e removerá todos os dados associados.</p>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded"
          disabled={deleting}
          onClick={async () => {
            if (!confirm('Tem a certeza que pretende eliminar a sua conta? Esta ação não pode ser desfeita.')) return
            setDeleting(true)
            try {
              const res = await fetch('/api/utilizador', { method: 'DELETE' })
              if (res.ok) {
                // redirect to home
                router.push(`/${initialLocale}`)
              } else {
                const err = await res.json()
                alert(err.error || 'Erro ao eliminar conta')
              }
            } catch (e: any) {
              alert('Erro: ' + String(e))
            } finally {
              setDeleting(false)
            }
          }}
        >
          {deleting ? 'Eliminando...' : 'Eliminar Conta'}
        </button>
      </section>

      <section>
        <NotificationSettings initialPreferences={initialPreferences} />
      </section>

      <section>
        <UserPreferences
          initialTheme={initialTheme}
          initialRadius={initialRadius}
          initialLatitude={initialLatitude}
          initialLongitude={initialLongitude}
          isEmpresa={isEmpresa}
        />
      </section>
    </>
  )
}
