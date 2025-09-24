export default function HowItWorks() {
  return (
    <section className="py-16 bg-background relative z-10">
      <div className="container-page">
        <h2 className="text-3xl font-bold text-center mb-12">Como funciona</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center card p-6">
            <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-2xl">↑</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Publique sua carga</h3>
            <p className="text-muted">Detalhes completos: tipo de veículo, peso, dimensões, locais e datas.</p>
          </div>
          <div className="text-center card p-6">
            <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-2xl">🔎</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Encontre correspondências</h3>
            <p className="text-muted">Pesquise por tipo de veículo, raio (0–400km) e preferências.</p>
          </div>
          <div className="text-center card p-6">
            <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-2xl">€</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Receba propostas</h3>
            <p className="text-muted">Transportadoras orçam, expedidores aceitam e confirmam — contacto após confirmação.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
