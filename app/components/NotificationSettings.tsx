'use client'

import { useState } from 'react'
import { useUpdateSettings } from '@/lib/hooks/useUpdateSettings'

type Preferences = {
  novasPropostas?: boolean
  atualizacoesCarga?: boolean
  sistema?: boolean
}

interface Props {
  initialPreferences?: Preferences
}

export default function NotificationSettings({ initialPreferences = {} }: Props) {
  const [preferences, setPreferences] = useState<Preferences>({
    novasPropostas: initialPreferences.novasPropostas ?? true,
    atualizacoesCarga: initialPreferences.atualizacoesCarga ?? true,
    sistema: initialPreferences.sistema ?? false,
  })

  const { update, loading } = useUpdateSettings()

  const handleToggle = async (key: keyof Preferences) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key],
    }

    setPreferences(updated)

    await update({ notificationPreferences: updated })
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Notificações por E-mail</h2>

      <div className="flex flex-col gap-2">
        <label>
          <input
            type="checkbox"
            checked={preferences.novasPropostas}
            onChange={() => handleToggle('novasPropostas')}
            disabled={loading}
          />
          {' '}Receber novas propostas
        </label>

        <label>
          <input
            type="checkbox"
            checked={preferences.atualizacoesCarga}
            onChange={() => handleToggle('atualizacoesCarga')}
            disabled={loading}
          />
          {' '}Atualizações de carga
        </label>

        <label>
          <input
            type="checkbox"
            checked={preferences.sistema}
            onChange={() => handleToggle('sistema')}
            disabled={loading}
          />
          {' '}Notificações do sistema
        </label>
      </div>
    </div>
  )
}
