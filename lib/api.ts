import { getApiBase } from './clientApiBase'

export async function updateUserSettings(settings: any) {
  const token = localStorage.getItem('token')

  if (!token) {
    throw new Error('Usuário não autenticado.')
  }

  const res = await fetch(getApiBase() + '/api/utilizador', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || 'Erro ao atualizar configurações.')
  }

  return res.json()
}
