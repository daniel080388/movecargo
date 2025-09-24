import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('./MapView.client'), { loading: () => <div>Carregando mapa…</div> })

export default function MapaPage() {
  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Mapa de Cargas</h1>
      <MapView />
    </div>
  )
}
