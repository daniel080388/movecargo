import { test, expect } from "@playwright/test";

test.describe("Autenticação", () => {
  test("Usuário consegue fazer login", async ({ page }) => {
    await page.goto("/login");

    await page.fill("#email", "demo@teste.com");
    await page.fill("#password", "123456");
    await page.click("#btn-login");

    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("Usuário consegue fazer logout", async ({ page }) => {
    // Pré-condição: usuário já logado
    await page.goto("/dashboard");

    await page.click("#logout");
    await expect(page).toHaveURL(/.*login/);
  });
});
