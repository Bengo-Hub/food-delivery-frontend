import { expect, test } from '@playwright/test';

test.describe('Ordering app login and landing', () => {
  test('landing or menu page loads for tenant', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/(urban-loft|menu)?\/?/, { timeout: 15_000 });
    const signInOrMenu = page.getByRole('link', { name: /sign in|login/i }).or(page.getByText(/menu|order/i));
    await expect(signInOrMenu.first()).toBeVisible({ timeout: 10_000 });
  });

  test('unauthenticated user can open catalog or see sign in', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page).toHaveURL(/\/catalog/, { timeout: 15_000 });
    await expect(
      page.getByRole('link', { name: /sign in|login/i }).or(page.getByRole('heading')).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
