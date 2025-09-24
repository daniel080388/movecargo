import { test, expect } from '@playwright/test';

test.describe('Configurações do usuário', () => {
  test('Usuário consegue alterar idioma', async ({ page }) => {
    await page.goto('/settings');

    const selector = page.locator('select#language');
    await selector.selectOption('en');

    await expect(selector).toHaveValue('en');
    await expect(page.getByText(/Language updated/i)).toBeVisible();
  });

  test('Usuário consegue alterar notificações', async ({ page }) => {
    await page.goto('/settings');

    const checkbox = page.locator('input#notifications');
    await checkbox.check();

    await expect(checkbox).toBeChecked();
    await expect(page.getByText(/Notificações atualizadas/i)).toBeVisible();
  });
});
