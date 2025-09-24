import { test, expect, Page } from '@playwright/test'

const genEmail = () => {
  const rand = Math.random().toString(36).slice(2, 8)
  return `trans_e2e_${Date.now()}_${rand}@example.com`
}

async function registerTransportadora(page: Page, locale: string = 'pt') {
  const email = genEmail()
  const response = await page.request.post('/api/auth/register', {
    data: {
      name: 'E2E Transportadora',
      email,
      password: 'Password@123',
      role: 'TRANSPORTADORA',
    },
    timeout: 60000,
  })
  expect(response.ok()).toBeTruthy()
  await page.goto(`/${locale}/login`)
  return { email, password: 'Password@123', locale }
}

async function login(page: Page, email: string, password: string, locale: string = 'pt') {
  const resp = await page.request.post('/api/auth/login', {
    data: { email, password },
    timeout: 60000,
  })
  expect(resp.ok()).toBeTruthy()
  const data = await resp.json()
  const token = (data as any).token as string
  expect(typeof token).toBe('string')
  // Ensure token is present before any app code runs
  await page.addInitScript((t) => {
    window.localStorage.setItem('token', t as string)
  }, token)
  await page.goto(`/${locale}/cargas`)
  await expect(page).toHaveURL(new RegExp(`/${locale}/cargas`), { timeout: 30000 })
  await expect(page.getByRole('button', { name: 'Pesquisar' })).toBeVisible({ timeout: 10000 })
}

test.describe('Registo e login de Transportadora', () => {
  test('Transportadora consegue registrar e entrar', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Temos uma condição intermitente específica do WebKit com redireções de locale; vamos cobrir Chromium/Firefox por agora.')
    const { email, password, locale } = await registerTransportadora(page)
    await login(page, email, password, locale)

  // Já estamos na página de cargas (login() navega explicitamente)
  })
})
