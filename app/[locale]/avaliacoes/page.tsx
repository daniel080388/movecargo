import AvaliacoesList from '../components/AvaliacoesList.client';

export default async function AvaliacoesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Avaliações</h1>
      <AvaliacoesList />
    </div>
  );
}
