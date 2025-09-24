# MoveCargo

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)


Projeto Next.js (App Router) com Prisma, i18n e fluxo básico de publicação de cargas e envio de propostas.

Pré-requisitos

- Node 18+
- PostgreSQL

Instalação

1. Copie `.env.example` para `.env.local` e ajuste `DATABASE_URL` e `JWT_SECRET`.
2. Instale dependências:

```powershell
npm install
```

3. Gere o cliente Prisma e rode migrações:

```powershell
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
```

4. Inicie a app em desenvolvimento:

```powershell
npm run dev
```

Notas

- As APIs residem em `app/api/*`.
- Para evitar que o middleware de i18n prefixe rotas de API, usamos `getApiBase()` em clientes e configuramos `middleware.ts` para não aplicar a localizacao a `/api`.
- O Mapbox foi adiado; o componente do mapa é isolado e pode ser ativado quando adicionares `NEXT_PUBLIC_MAPBOX_TOKEN`.

Pagamentos (Stripe)
-------------------
Este repo inclui um esqueleto para integração com Stripe (endpoints: `/api/payments/create-session` e `/api/payments/webhook`). Para testar pagamentos em modo dev:

1. Define `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` em `.env.local`.
2. Executa `npm install stripe` localmente.
3. Corre `npx prisma migrate dev` para aplicar os novos modelos (Plan/Subscription) e `npx prisma generate`.

Testes automatizados (Jest)
---------------------------
- Para correr os testes unitários/integration (Jest):

```powershell
npm test
```

- Para ver em modo watch:

```powershell
npm run test:watch
```

- Os testes E2E do Playwright moram em `tests-e2e/` e são executados separadamente com:

```powershell
npx playwright test
```

- Para ver cobertura localmente (relatório em `coverage/`):

```powershell
npm run test:ci
```

CI (GitHub Actions)
-------------------
- O workflow `/.github/workflows/ci.yml` está dividido por fases para falha rápida:
	- Lint + Typecheck → para cedo se houver problemas
	- Jest (unit/integration) com cobertura
	- Playwright (E2E) após build/start e health-check
	- Artefatos de cobertura publicados no final
- Thresholds mínimos de cobertura (Jest): statements 50, branches 40, functions 45, lines 50.
- Há um job `e2e` que provisiona Postgres, aplica migrações/seed, faz build/start do Next, espera `/api/health` e roda Playwright (`tests-e2e/`).

Nota: Substitui `OWNER/REPO` no badge acima pelo teu repositório (ex.: `i7/movecargo`).

Problemas comuns
----------------
- "Playwright Test needs to be invoked via 'npx playwright test'":
	Isso acontece se o Jest tentar executar os testes E2E. Já configurámos o `jest.config.cjs` para ignorar `tests-e2e/`, mas verifica se os ficheiros E2E estão dentro dessa pasta.
- "Stripe not configured on server":
	O teste de `create-session` verifica o comportamento quando `STRIPE_SECRET_KEY` não está definido (espera 500). Para testar o caminho feliz, define a variável no ambiente do teste ou mantém o mock do SDK.


Contribuição

- Formata o código com Prettier, corre ESLint antes de PR.
- Ex.: `npm run lint`, `npm run test`.

