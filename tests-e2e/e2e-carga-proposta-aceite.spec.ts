import { test, expect, type Page } from '@playwright/test'

// Pequeno helper para login via UI
async function login(page: Page, locale: string, email: string, password: string) {
  await page.goto(`/${locale}/login`)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForFunction(() => !!localStorage.getItem('token'))
}

// Publicar carga (form UI na página empresa/publicar)
async function publicarCarga(page: Page, locale: string) {
  await page.goto(`/${locale}/empresa/publicar`)
  await page.getByLabel(/Origem/i).fill('Lisboa, PT')
  await page.getByLabel(/Destino/i).fill('Madrid, ES')
  await page.getByLabel(/Descrição|Descricao|Descrição da carga/i).fill('Paletes 500kg')
  await page.getByLabel(/Preço|Preco/i).fill('450')
  await page.getByRole('button', { name: /Publicar|Criar|Guardar/i }).click()
  await expect(page.getByText(/Carg(a|o) criada|Criada com sucesso|Publicada/i)).toBeVisible({ timeout: 5000 })
}

// Motorista envia proposta na página da carga
async function enviarProposta(page: Page, locale: string) {
  // Aceder à lista/marketplace e abrir a primeira carga
  await page.goto(`/${locale}/cargas`)
  const firstCard = page.getByRole('link').first()
  await firstCard.click()
  await page.waitForURL(new RegExp(`/${locale}/cargas/\\d+`))

  await page.getByRole('button', { name: /Enviar proposta|Fazer proposta/i }).click()
  await page.getByLabel(/Valor|Preço|Preco/i).fill('400')
  await page.getByLabel(/Mensagem/i).fill('Posso recolher amanhã')
  await page.getByRole('button', { name: /Submeter|Enviar/i }).click()
  await expect(page.getByText(/Proposta enviada|Criada/i)).toBeVisible({ timeout: 5000 })
}

// Empresa aceita a proposta
async function aceitarProposta(page: Page, locale: string) {
  await page.goto(`/${locale}/empresa/dashboard`)
  // Abrir secção de propostas/cargas recentes e aceitar a primeira
  const aceitarBtn = page.getByRole('button', { name: /Aceitar/i }).first()
  await aceitarBtn.click()
  await expect(page.getByText(/Proposta aceite|aceita com sucesso/i)).toBeVisible({ timeout: 5000 })
}

// Verificar estado aceite no dashboard
async function verificarAceitacao(page: Page, locale: string) {
  await page.goto(`/${locale}/empresa/dashboard`)
  await expect(page.getByText(/Aceita|ACEITA/i)).toBeVisible()
}

// Fluxo E2E principal
// Requisitos: baseURL http://localhost:3000, base de dados com os utilizadores de teste
// Empresa: empresa@example.com / password: 123456
// Motorista: motorista@example.com / password: 123456
// Se as credenciais diferirem, ajustar abaixo ou parametrizar por env vars.

test('Fluxo completo: publicar carga → proposta → aceitar → avaliar', async ({ browser, baseURL }) => {
  const locale = 'pt'

  // Empresa A (dona da carga1 no seed)
  const ctxEmpresa = await browser.newContext()
  const empresa = await ctxEmpresa.newPage()
  // Seed dados
  const seedRes = await ctxEmpresa.request.post(`${baseURL}/api/test/seed`, { data: {} })
  expect(seedRes.ok()).toBeTruthy()
  await login(empresa, locale, 'empresaA@example.com', 'password123')

  // Obter token do localStorage para chamadas autenticadas
  const tokenEmpresa = await empresa.evaluate(() => localStorage.getItem('token'))
  expect(tokenEmpresa).toBeTruthy()

  // Criar uma nova carga via API para este teste
  const createCarga = await ctxEmpresa.request.post(`${baseURL}/api/empresa/cargas`, {
    headers: { Authorization: `Bearer ${tokenEmpresa}`, 'Content-Type': 'application/json' },
    data: { titulo: 'E2E Carga', descricao: 'Gerada no teste', origem: 'Porto, PT', destino: 'Lisboa, PT', pesoKg: 500 }
  })
  expect(createCarga.ok()).toBeTruthy()
  const createdCargaJson = await createCarga.json()
  const cargaId = createdCargaJson?.carga?.id
  expect(cargaId).toBeTruthy()

  await empresa.goto(`/${locale}/cargas/${cargaId}/propostas`)
  // Antes, criar uma proposta via API como motorista
  const ctxMotoristaSeed = await browser.newContext()
  const motoristaSeed = await ctxMotoristaSeed.newPage()
  await login(motoristaSeed, locale, 'transx@example.com', 'password123')
  const tokenMotorista = await motoristaSeed.evaluate(() => localStorage.getItem('token'))
  expect(tokenMotorista).toBeTruthy()
  const createProposta = await ctxMotoristaSeed.request.post(`${baseURL}/api/cargas/${cargaId}/propostas`, {
    headers: { Authorization: `Bearer ${tokenMotorista}`, 'Content-Type': 'application/json' },
    data: { valor: 400, mensagem: 'Proposta E2E' }
  })
  expect(createProposta.ok()).toBeTruthy()
  const createPropostaJson = await createProposta.json()
  const propostaId = createPropostaJson?.proposta?.id
  expect(propostaId).toBeTruthy()
  await ctxMotoristaSeed.close()

  await empresa.reload()
  // Aceitar a proposta pendente específica (scopar no item da lista que contém a mensagem única)
  // Esperar que a proposta apareça na lista
  await expect(empresa.getByText('Proposta E2E').first()).toBeVisible({ timeout: 20000 })
  const item = empresa.locator(`[data-testid="proposta-item-${propostaId}"]`)
  const acceptBtn = item.getByRole('button', { name: /Aceitar/i })
  await expect(item).toBeVisible({ timeout: 15000 })
  await expect(acceptBtn).toBeVisible({ timeout: 15000 })
  const [resp] = await Promise.all([
    empresa.waitForResponse(r => r.url().includes(`/api/propostas/${propostaId}/aceitar`) && r.status() === 200),
    acceptBtn.click(),
  ])
  expect(resp.ok()).toBeTruthy()
  await expect(empresa.locator(`[data-testid="proposta-status-${propostaId}"]`)).toHaveText('Aceita', { timeout: 20000 })

  // Motorista (transportadora X do seed)
  const ctxMotorista = await browser.newContext()
  const motorista = await ctxMotorista.newPage()
  await login(motorista, locale, 'transx@example.com', 'password123')

  // Empresa avalia a transportadora
  // Descobrir motoristaId da proposta aceite
  const propsRes = await ctxEmpresa.request.get(`${baseURL}/api/cargas/${cargaId}/propostas`)
  const propsJson = await propsRes.json()
  const aceita = (propsJson.propostas || []).find((p: any) => p.status === 'ACEITA')
  expect(aceita?.motorista?.id).toBeTruthy()
  const comentario = `E2E-review-${Date.now()}`
  const createReview = await ctxEmpresa.request.post(`${baseURL}/api/avaliacoes`, {
    headers: { Authorization: `Bearer ${tokenEmpresa}`, 'Content-Type': 'application/json' },
    data: { toUserId: aceita.motorista.id, rating: 5, comentario }
  })
  expect(createReview.ok()).toBeTruthy()

  // Motorista vê a avaliação recebida (via API)
  const tokenMotoristaFinal = await motorista.evaluate(() => localStorage.getItem('token'))
  expect(tokenMotoristaFinal).toBeTruthy()
  const reviewsRes = await ctxMotorista.request.get(`${baseURL}/api/avaliacoes`, { headers: { Authorization: `Bearer ${tokenMotoristaFinal}` } })
  expect(reviewsRes.ok()).toBeTruthy()
  const reviewsJson = await reviewsRes.json()
  const found = (reviewsJson.avaliacoes || []).some((a: any) => a.comentario === comentario)
  expect(found).toBeTruthy()

  await ctxEmpresa.close()
  await ctxMotorista.close()
})
