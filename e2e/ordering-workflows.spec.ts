import { expect, test } from '@playwright/test';

test.describe('Ordering workflows', () => {
  test('catalog page has categories or items', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page).toHaveURL(/\/catalog/, { timeout: 15_000 });
    const hasContent = page.getByRole('heading').or(page.getByText(/category|menu|add to cart/i));
    await expect(hasContent.first()).toBeVisible({ timeout: 10_000 });
  });

  test('cart or checkout entry point visible when applicable', async ({ page }) => {
    await page.goto('/');
    const cartOrCheckout = page.getByRole('button', { name: /cart|bag/i }).or(page.getByText(/checkout|view cart/i));
    await expect(cartOrCheckout.first()).toBeVisible({ timeout: 10_000 });
  });
});
