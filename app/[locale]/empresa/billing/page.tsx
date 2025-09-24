import SubscriptionCard from './SubscriptionCard.client';

export default async function BillingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  // server component: renders the client card
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Gestão da Subscrição</h1>
  {/* pass locale to client component */}
  <SubscriptionCard locale={locale} />
    </div>
  );
}
