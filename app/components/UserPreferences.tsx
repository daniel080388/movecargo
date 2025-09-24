'use client'

import { useState } from 'react'
import { useUpdateSettings } from '@/lib/hooks/useUpdateSettings'

interface Props {
  initialTheme?: string
  initialRadius?: number
  initialLatitude?: number | string
  initialLongitude?: number | string
  isEmpresa?: boolean
}

export default function UserPreferences({
  initialTheme = 'sistema',
  initialRadius = 100,
  initialLatitude = '',
  initialLongitude = '',
  isEmpresa = false,
}: Props) {
  const [theme, setTheme] = useState(initialTheme)
  const [radius, setRadius] = useState(initialRadius)
  const [latitude, setLatitude] = useState(initialLatitude)
  const [longitude, setLongitude] = useState(initialLongitude)

  const { update, loading } = useUpdateSettings()

  const handleSave = async () => {
    await update({
      theme,
      searchRadius: radius,
      ...(isEmpresa && {
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string),
      }),
    })
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Interface e Preferências</h2>

      <div className="mb-4">
        <label htmlFor="theme" className="block mb-1">
          Tema:
        </label>
        <select
          id="theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="border p-1"
        >
          <option value="claro">Claro</option>
          <option value="escuro">Escuro</option>
          <option value="sistema">Sistema</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="radius" className="block mb-1">
          Raio padrão de pesquisa (km):
        </label>
        <input
          id="radius"
          type="number"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          min={0}
          className="border p-1 w-full"
        />
      </div>

      {isEmpresa && (
        <>
          <div className="mb-4">
            <label htmlFor="latitude" className="block mb-1">
              Latitude:
            </label>
            <input
              id="latitude"
              type="number"
              step="0.000001"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="border p-1 w-full"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="longitude" className="block mb-1">
              Longitude:
            </label>
            <input
              id="longitude"
              type="number"
              step="0.000001"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="border p-1 w-full"
            />
          </div>
        </>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  )
}
