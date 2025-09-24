# Deploy (Vercel + Domínio movecargo.eu)

This repo is a Next.js App Router app (TypeScript) with a PostgreSQL database via Prisma and Stripe webhooks.

## 1) Frontend/App na Vercel

- Create a new Project from this GitHub repo.
- Framework preset: Next.js
- Node version: 20 (Project Settings → General → Node.js version)
- Build command: `next build`
- Output directory: `.next`
- Install command: `npm install`

### Variáveis de ambiente (Vercel → Settings → Environment Variables)
Set these for Production (and Preview if you want preview deployments to work):

- NEXT_PUBLIC_APP_URL = https://movecargo.eu (ou o seu domínio customizado)
- NEXT_PUBLIC_MAPBOX_TOKEN = <your_mapbox_public_token>
- JWT_SECRET = <a strong secret for JWT>
- DATABASE_URL = <PostgreSQL connection string from Railway/Neon/etc>
- STRIPE_SECRET_KEY = sk_live_...
- STRIPE_WEBHOOK_SECRET = whsec_...
- STRIPE_PROCESSED_FILE = ./data/stripe-processed-events.json (local only; see Stripe notes below)
- SUPPORT_RATE_LIMIT = 20 (optional)
- SUPPORT_RATE_WINDOW_MS = 60000 (optional)
- REDIS_URL = <Redis connection> (optional, for support chat rate-limiting)
- OPENAI_API_KEY = <optional, for AI support chat>

URL do webhook Stripe em produção:
- In Stripe Dashboard → Developers → Webhooks, set the endpoint to: `https://movecargo.eu/api/payments/webhook`

Notas importantes para Vercel:
- Do NOT rely on writing to the filesystem in serverless functions. The current Stripe webhook uses `STRIPE_PROCESSED_FILE` for idempotency (file-based). This works locally, but is not reliable on serverless.
  - Production recommendation: store processed event IDs in your database (a simple `stripe_event` table with unique constraint on `event_id`) or Redis. Update `/app/api/payments/webhook/route.ts` accordingly before going live.
- API routes run on the Node.js runtime by default. Keep it (don’t switch this route to Edge) to ensure body parsing and HMAC work as expected.

## 2) Base de Dados (PostgreSQL em Railway/Neon/Supabase)

This project’s Prisma schema uses `provider = "postgresql"`, so prefer Railway, Neon or Supabase for Postgres. PlanetScale is MySQL and would require a schema/provider change.

Passos (ex.: Railway):
- Create a new PostgreSQL database.
- Copy the `DATABASE_URL` from Railway and add it to Vercel envs.
- Apply schema migrations from your local machine (recommended):
  1) Ensure `DATABASE_URL` is set locally to the production URL (temporary for migration).
  2) Run `npx prisma migrate deploy` to apply migrations.
  3) Optionally seed if needed (design your production seed carefully).
- Alternatively, add a deploy step in your CI/CD that runs `prisma migrate deploy` against the production DB.

## 3) Ficheiros de ambiente local

For local development create a `.env.local` with values like:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAPBOX_TOKEN=pk.abc...
JWT_SECRET=local-dev-secret
DATABASE_URL=postgres://user:pass@localhost:5432/movecargo
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_PROCESSED_FILE=./data/stripe-processed-events.json
SUPPORT_RATE_LIMIT=20
SUPPORT_RATE_WINDOW_MS=60000
# optional
REDIS_URL=
OPENAI_API_KEY=
```

For reference, `.env.production` (if you keep one locally for manual builds) should mirror the variables configured in Vercel.

## 4) Stripe: teste vs produção

- Use Stripe CLI or the provided scripts (`scripts/sendTestWebhook*.mjs`) only in dev.
- In production, Stripe will call your Vercel URL. Ensure:
  - STRIPE_SECRET_KEY (live)
  - STRIPE_WEBHOOK_SECRET (from the production webhook endpoint)
  - Idempotency storage is not file-based (see note above).

## 5) Verificações pós-deploy

- Health endpoint: `GET /api/health` should return 200.
- Auth: login, JWT stored client-side, protected endpoints work.
- Map: Home and map pages render with Mapbox (requires NEXT_PUBLIC_MAPBOX_TOKEN).
- Stripe webhook: send a test event from Stripe dashboard; verify 200 and idempotency.

## 6) Endurecimento opcional
\
\
## 7) Ligar o domínio movecargo.eu

1. Em Vercel, Project → Settings → Domains → Add: `movecargo.eu` e `www.movecargo.eu`.
2. No seu registrador de domínio, atualize o DNS:
  - `www` → CNAME → `cname.vercel-dns.com`.
  - Raiz `movecargo.eu` → A / ALIAS para Vercel (ou mude os nameservers para os da Vercel e faça o apontamento lá).
3. Aguarde a propagação e verifique o SSL (Vercel emite automaticamente).
4. Atualize `NEXT_PUBLIC_APP_URL` nas envs para `https://movecargo.eu`.

\
\
## 8) Criar o primeiro utilizador em produção

Como Vercel não disponibiliza shell interativo, execute o script a partir da sua máquina apontando o `DATABASE_URL` de produção.

Exemplos (PowerShell no Windows):

```
$env:DATABASE_URL = "postgres://<user>:<pass>@<host>:<port>/<db>?sslmode=require"
npm run -s user:create -- --name "Empresa Admin" --email admin@movecargo.eu --password "UmaSenhaForte#123" --role EMPRESA --locale pt
```

Para criar uma transportadora:

```
$env:DATABASE_URL = "postgres://<user>:<pass>@<host>:<port>/<db>?sslmode=require"
npm run -s user:create -- --name "Transportadora X" --email ops@carrier.eu --password "OutraSenha#123" --role TRANSPORTADORA --locale pt --latitude 41.15 --longitude -8.62
```

Notas:
- Roles válidos: `EMPRESA` ou `TRANSPORTADORA`.
- O script faz upsert com base no email (atualiza se já existir).
- Reque o `DATABASE_URL` de produção (copie de Vercel → Settings → Environment Variables).

- Move idempotency to DB (recommended for serverless).
- Add `prisma migrate deploy` to a release pipeline step.
- Configure um domínio customizado (ex.: movecargo.eu) no Vercel e atualize `NEXT_PUBLIC_APP_URL`.
- Add monitoring/log drains for function errors (Vercel integrations).
