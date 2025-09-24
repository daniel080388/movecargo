import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('Carrega título e dados principais', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Carregando/i)).not.toBeVisible();
  });
});
