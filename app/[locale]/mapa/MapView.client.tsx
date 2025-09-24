"use client"
import mapboxgl from 'mapbox-gl'
import React, { useEffect, useRef, useState } from 'react'

type Carga = {
  id: number
  titulo: string
  latitude: number | null
  longitude: number | null
  origem?: string
  distance?: number
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export default function MapView() {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<mapboxgl.Map | null>(null)
  const [loading, setLoading] = useState(false)
  const [city, setCity] = useState<string>('Lisboa')
  const [radius, setRadius] = useState<number>(100)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLon, setUserLon] = useState<number | null>(null)

  async function loadCargas() {
    setLoading(true)
    try {
      const url = new URL('/api/cargas', window.location.origin)
      if (userLat != null && userLon != null) {
        url.searchParams.set('lat', String(userLat))
        url.searchParams.set('lon', String(userLon))
      } else if (city) {
        url.searchParams.set('cidade', city)
      }
      if (radius) url.searchParams.set('raioKm', String(radius))
      const res = await fetch(url.toString())
      const data: any[] = await res.json()
      const cargas: Carga[] = data
      // clear old markers
      for (const m of markersRef.current) m.remove()
      markersRef.current = []
      // add markers
      cargas.filter(c => c.latitude != null && c.longitude != null).forEach(c => {
        const el = document.createElement('div')
        el.className = 'rounded-full bg-blue-600 w-3 h-3 border-2 border-white shadow'
        const mk = new mapboxgl.Marker({ element: el })
          .setLngLat([Number(c.longitude), Number(c.latitude)])
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>${c.titulo}</strong><br/>Origem: ${c.origem || ''}${c.distance ? `<br/>${c.distance.toFixed(1)} km` : ''}`))
          .addTo(mapInstance.current!)
        markersRef.current.push(mk)
      })
      // fit bounds
      if (cargas.length > 0) {
        const bounds = new mapboxgl.LngLatBounds()
        cargas.filter(c => c.latitude != null && c.longitude != null).forEach(c => bounds.extend([Number(c.longitude), Number(c.latitude)] as [number, number]))
        if (!bounds.isEmpty()) mapInstance.current!.fitBounds(bounds, { padding: 40, animate: true })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    // Europe bounding box: [west, south] to [east, north]
    const europeBounds: [[number, number], [number, number]] = [
      [-31, 34],
      [40, 72],
    ]
    mapInstance.current = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-9.142685, 38.736946],
      zoom: 5,
      maxBounds: europeBounds, // impede pan para fora da Europa
    })
    // Ajusta a viewport inicial para mostrar a Europa inteira
    mapInstance.current.fitBounds(europeBounds, { padding: 40, animate: false })
    mapInstance.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right')
  }, [])

  function useMyLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setUserLat(latitude)
        setUserLon(longitude)
        if (mapInstance.current) {
          mapInstance.current.flyTo({ center: [longitude, latitude], zoom: 9 })
        }
        // auto-load cargas near my location
        setTimeout(() => { loadCargas() }, 0)
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 }
    )
  }

  // optional: auto refresh when filters change (debounced by user action typically)
  useEffect(() => {
    // Do not auto-load on initial mount without user action
    // but if user typed a city or changed radius, allow manual click.
  }, [city, radius])

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end flex-wrap">
        <div>
          <label className="block text-sm text-gray-600">Cidade</label>
          <input className="border p-2" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Raio (km)</label>
          <input className="border p-2 w-24" type="number" min={1} max={400} value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
        </div>
        <button className="border px-3 py-2 rounded" type="button" onClick={useMyLocation}>Usar minha localização</button>
        <button className="btn-primary" onClick={loadCargas} disabled={loading}>{loading ? 'A carregar…' : 'Pesquisar'}</button>
      </div>
      <div ref={mapRef} className="w-full h-[70vh] rounded overflow-hidden border" />
      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="text-sm text-red-600">Defina NEXT_PUBLIC_MAPBOX_TOKEN no .env.local para ver o mapa.</div>
      )}
    </div>
  )
}
