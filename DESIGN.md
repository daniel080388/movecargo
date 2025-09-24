MoveCargo — Documento de Design (resumo)

Objetivo
--------
Criar um marketplace europeu para transporte de cargas onde empresas anunciam cargas e transportadoras (motoristas/frotas) fazem propostas. Início com modelo gratuito (marketplace aberto). Futuramente adicionar planos pagos (assinaturas / cobranças por lead) e app móvel.

Público-alvo
-----------
- Empresas que precisam transportar mercadorias (publicadores de cargas)
- Transportadoras / motoristas que submetem propostas

MVP (mínimo viável)
-------------------
1. Autenticação/Contas
   - Registo/login (roles: empresa, transportadora)
   - JWT simples, refresh tokens opcionais
2. Marketplace core
   - CRUD Cargas (origem, destinos, datas, características)
   - Listagem (filtros por localização / raio, tipo de camião)
   - Envio de propostas por transportadora
   - Aceitar/Recusar propostas (empresa) → ao aceitar, contatos do motorista ficam visíveis
   - Avaliações básicas (empresa avalia motorista após aceite)
3. Internacionalização (i18n) para PLN/EN/ES/FR/DE (já presente)
4. UI responsiva + PWA (opcional) para acesso móvel inicial
5. APIs documentadas e seeds para onboarding dev

Decisões técnicas
-----------------
- Framework: Next.js (App Router) — já em uso
- Banco: PostgreSQL + Prisma ORM — já em uso
- Autenticação: JWT com helper `getUserFromRequest` (server-side). Mais tarde adicionar refresh tokens e verificação por email
- Pagamentos (fase 2): Stripe (recomendado) para planos e cobrança; webhook handler em `/api/payments/webhook`
- Mapas: Mapbox (integração isolada, adiada até haver token)
- Mobile: começar como PWA (mais rápido). Se houver orçamento, depois React Native dedicado.
- Tests: Jest + Playwright (E2E) para fluxos críticos
- Deploy: Vercel para frontend; Railway/Heroku/Amazon RDS para Postgres (ou Supabase)

Segurança e privacidade
----------------------
- Não expor contatos até `contactsReleased` = true
- Hashear passwords com bcrypt
- Variáveis sensíveis via `.env` (JWT_SECRET, DATABASE_URL, STRIPE_KEY)

Roadmap curto (prioridades e estimativas)
-----------------------------------------
Estimativas em dias úteis para 1 dev experiente (valores aproximados):

Fase 0 — Preparação (1-2 dias)
- Ajustar ambiente, criar `.env.example`, seeds e scripts

Fase 1 — Core MVP backend + DB (6-10 dias)
- Modelos Prisma (Carga, Destino, Proposta, Avaliacao, User)
- Endpoints CRUD e rotas principais (listar, criar, aceitar/recusar)
- Testes unitários mínimos e seed

Fase 2 — Frontend + UI (6-10 dias)
- Feed de cargas, detalhe, enviar proposta, dashboards (empresa/transportadora)
- Estados de loading/empty/error, i18n textos
- PWA manifesto e service worker (opcional)

Fase 3 — Autenticação avançada e DX (3-5 dias)
- Refresh tokens, forgot-password, email verify
- ESLint, Prettier, scripts, documentação

Fase 4 — Pagamentos & Subscrições (4-7 dias)
- Integração Stripe (plans, checkout, webhooks)
- Página de administração de planos

Fase 5 — Mobile & E2E (5-10 dias)
- PWA otimizado ou scaffold RN + autenticação
- Playwright E2E para fluxo crítico

Deploy e manutenção contínua (2 dias)
- Pipeline CI (test, lint), deploy e documentação final

Observações de implementação
----------------------------
- Iniciar por Backend (Fase1) + endpoints documentados; isto permite paralelizar frontend.
- Manter integração do Mapbox isolada num componente que só é activada quando `NEXT_PUBLIC_MAPBOX_TOKEN` estiver definido.
- Criar scripts de DB (reset + seed) e documentação clara para contribuir.

Requisitos e decisões pendentes (preciso que confirmes):
- Pagamentos: queres Stripe? (recomendado) — ou outro provider?
- Mobile: preferes PWA primeiro ou devemos scaffold RN directamente?
- Hey: pretendes cobrança por lead (empresa paga por propostas) ou por subscrição mensal para empresas/transportadoras?

Próximos passos imediatos (vou executar se confirmares):
1. Finalizar e testar endpoints core (Cargas/Propostas/Avaliações). (hoje)
2. Criar documentação de API mínima / Postman collection. (hoje)
3. Implementar autenticação refinada e UI básica de dashboards. (seguinte)


FAQ rápido
----------
Q: É seguro por omissão?
A: Sim — contactos só são mostrados após aceite da proposta. Senhas hasheadas. HTTPS em produção obrigatório.

Q: Podemos alterar modelo mais tarde?
A: Sim, Prisma facilita migrações; para mudanças disruptivas, vamos versionar e migrar com cuidado.

---

Se estiveres de acordo eu inicio a Fase 1 (Marketplace core backend): vou finalizar endpoints, adicionar testes mínimos e preparar o deploy. Se quiseres, implemento também o fluxo Stripe (esqueleto) em paralelo.
