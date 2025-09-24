'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { updateUserSettings } from '../api'

export function useUpdateSettings() {
  const [loading, setLoading] = useState(false)

  const update = async (settings: any) => {
    setLoading(true)

    try {
      await updateUserSettings(settings)
      toast.success('Configurações atualizadas com sucesso!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar configurações.')
    } finally {
      setLoading(false)
    }
  }

  return { update, loading }
}
