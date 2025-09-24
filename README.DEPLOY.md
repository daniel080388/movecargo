# Deploy (Vercel + Domínio movecargo.eu)

This repo is a Next.js App Router app (TypeScript) with a PostgreSQL database via Prisma and Stripe webhooks.

## 1) Frontend/App na Vercel

- Create a new Project from this GitHub repo.
- Framework preset: Next.js
- Node version: 20 (Project Settings → General → Node.js version)
- Build command: `next build`
- Output directory: `.next`
- Install command: `npm install`

### Variáveis de Ambiente (Vercel → Settings → Environment Variables)

ATENÇÃO: O build corre `prisma migrate deploy` antes de `next build`, por isso a variável `DATABASE_URL` é OBRIGATÓRIA no ambiente da Vercel. Sem ela o build falha imediatamente (verificamos isto com `scripts/prebuild-check.mjs`).

Configure, no mínimo, em Production (e em Preview se usar deploys de PR):

- NEXT_PUBLIC_APP_URL = https://movecargo.eu (ou o seu domínio customizado)
- NEXT_PUBLIC_MAPBOX_TOKEN = <your_mapbox_public_token>
- JWT_SECRET = <a strong secret for JWT>
- DATABASE_URL = <PostgreSQL connection string de Railway/Neon/Supabase/etc>
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
  - Recomendação para Produção: guardar os event IDs na base de dados (tabela `stripe_event` com unique em `event_id`) ou Redis. Atualize `/app/api/payments/webhook/route.ts` antes de ir live.
- API routes run on the Node.js runtime by default. Keep it (don’t switch this route to Edge) to ensure body parsing and HMAC work as expected.

## 2) Base de Dados (PostgreSQL em Railway/Neon/Supabase)

O Prisma está configurado com `provider = "postgresql"`, por isso prefira Railway, Neon ou Supabase para Postgres. PlanetScale é MySQL e exigiria alterar o provider e o schema.

Passos (ex.: Railway):
- Create a new PostgreSQL database.
- Copy the `DATABASE_URL` from Railway and add it to Vercel envs.
- Apply schema migrations from your local machine (recommended):
  1) Garanta `DATABASE_URL` local temporariamente apontada à BD de produção.
  2) Execute `npx prisma migrate deploy` para aplicar migrações.
  3) Opcional: fazer seed com cautela (dados de produção!).
- Alternatively, add a deploy step in your CI/CD that runs `prisma migrate deploy` against the production DB.

## 3) Ficheiros de Ambiente Local

Para desenvolvimento local, crie `.env.local` com algo como:

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

Se mantiver `.env.production` local para builds manuais, espelhe as variáveis configuradas na Vercel.

## 4) Stripe: Teste vs Produção

- Use Stripe CLI ou os scripts (`scripts/sendTestWebhook*.mjs`) apenas em desenvolvimento.
- Em produção, a Stripe chamará a URL na Vercel. Garanta:
  - STRIPE_SECRET_KEY (live)
  - STRIPE_WEBHOOK_SECRET (from the production webhook endpoint)
  - Idempotency storage is not file-based (see note above).

## 5) Verificações Pós-Deploy

- Health endpoint: `GET /api/health` should return 200.
- Auth: login, JWT stored client-side, protected endpoints work.
- Map: páginas de Home e Mapa renderizam com Mapbox (requer NEXT_PUBLIC_MAPBOX_TOKEN).
- Stripe webhook: send a test event from Stripe dashboard; verify 200 and idempotency.

## 6) Endurecimento Opcional
\
\
## 7) Ligar o Domínio movecargo.eu

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
