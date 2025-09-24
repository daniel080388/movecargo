"use client";
import React, { useEffect, useState } from 'react';

type Plan = {
  id: number | string;
  name: string;
  description?: string | null;
  priceCents: number;
  currency: string;
  stripeId?: string | null;
  active: boolean;
};

export default function SubscriptionCard({ locale }: { locale?: string }) {
  const [subscription, setSubscription] = useState<any | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/empresa/subscription')
      .then((r) => r.json())
      .then((d) => setSubscription(d.subscription || null))
      .catch(() => setSubscription(null))
      .finally(() => setLoading(false));

    fetch('/api/payments/plans')
      .then((r) => r.json())
      .then((d) => setPlans(d.plans || []))
      .catch(() => setPlans([]));
  }, []);

  async function handleCancel() {
    if (!confirm('Cancelar a subscrição localmente?')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/empresa/subscription/cancel', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSubscription(data.subscription);
        alert('Subscrição cancelada');
      } else {
        alert(data.error || 'Erro ao cancelar');
      }
    } catch (err: any) {
      alert(String(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckout(plan: Plan) {
    setActionLoading(true);
    try {
      const resp = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.stripeId, successUrl: window.location.origin + '/' + (locale || 'pt') + '/empresa/billing/success', cancelUrl: window.location.href }),
      });
      const data = await resp.json();
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else if (data.sessionId) {
        window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
      } else if (data.error) {
        alert('Erro: ' + data.error);
      }
    } catch (err: any) {
      alert('Erro ao iniciar checkout: ' + String(err));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-3">Estado da subscrição</h2>
      {loading && <p>Carregando...</p>}
      {!loading && (
        <div className="mb-6">
          {subscription ? (
            <div className="border rounded p-4">
              <p className="font-medium">Plano: {subscription.plan?.name || '—'}</p>
              <p>Status: {subscription.status}</p>
              <p>Termina em: {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleString() : '—'}</p>
              <div className="mt-3">
                <button className="btn-secondary mr-2" onClick={handleCancel} disabled={actionLoading}>
                  {actionLoading ? 'Processando...' : 'Cancelar subscrição'}
                </button>
              </div>
            </div>
          ) : (
            <p>Sem subscrição activa.</p>
          )}
        </div>
      )}

      <h2 className="text-xl font-semibold mb-3">Planos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((p) => (
          <div key={String(p.id)} className="border p-4 rounded">
            <h3 className="font-semibold">{p.name} — {(p.priceCents / 100).toFixed(2)} {p.currency.toUpperCase()}</h3>
            <p className="text-sm text-gray-600">{p.description}</p>
            <div className="mt-3">
              <button className="btn-primary" onClick={() => handleCheckout(p)} disabled={actionLoading || !p.stripeId}>
                {actionLoading ? 'A processar...' : p.priceCents === 0 ? 'Escolher' : 'Assinar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
