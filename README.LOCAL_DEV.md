# Movecargo — Local dev & Stripe webhook guide

Este ficheiro descreve os passos rápidos para arrancar o projecto em desenvolvimento, testar webhooks Stripe localmente, e preparar um deploy rápido.

## 1) Requisitos
- Node.js >= 18
- pnpm / npm
- PostgreSQL (local) ou strings DB configurada em `DATABASE_URL`

## 2) Variáveis de ambiente (exemplo `.env.local`)
Cria um `.env.local` na raiz com pelo menos:

DATABASE_URL="postgresql://..."
JWT_SECRET=algumsegredo
STRIPE_WEBHOOK_SECRET=whsec_...   # usado para validar webhooks localmente
# STRIPE_SECRET_KEY=sk_test_...   # opcional para criar sessões

## 3) Rodar em desenvolvimento
1. Instala dependências

npm install

2. Gerar Prisma client (se necessário)

npx prisma generate

3. Iniciar o servidor de dev

npm run dev

Verifica o console: deve aparecer `Local: http://localhost:3000`.

## 4) Testar webhooks Stripe localmente
Tens duas opções:

A) Usar Stripe CLI (recomendado)

1. Instala e login

stripe login

2. Encaminha eventos para o teu dev server (exemplo)

stripe listen --forward-to localhost:3000/api/payments/webhook

3. Envia um event (exemplo)

stripe trigger customer.subscription.created

B) Usar scripts de teste incluidos (útil sem Stripe CLI)

- O projeto inclui `scripts/sendTestWebhook.mjs` que usa `STRIPE_WEBHOOK_SECRET` para assinar eventos de teste.

Exemplo (PowerShell):

$env:WEBHOOK_URL='http://localhost:3000/api/payments/webhook'; node scripts/sendTestWebhook.mjs

Se o teu servidor estiver a correr noutra porta, define `WEBHOOK_URL`.

## 5) Validar subscrições no DB
Após o envio do evento, corre:

node scripts/checkSubscriptions.mjs

para ver as subscrições persistidas.

## 6) Deploy rápido (Vercel)
1. Push para um repositório GitHub.
2. Conecta o repositório em Vercel.
3. Define as variáveis de ambiente em Vercel (DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET).
4. Deploy automático deve funcionar — confirma logs.

## 7) CI Suggestions
- Adicionar workflow que roda:
  - npm ci
  - npx tsc --noEmit
  - npm test


Se preferires, eu posso adicionar um `github/workflows/ci.yml` com os passos acima.
