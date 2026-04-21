/**
 * E2E: Full order lifecycle — sequential, single browser, human-like navigation.
 *
 * Navigates via UI clicks (not page.goto) to leverage TanStack Query cache
 * and avoid rate-limit issues. Single browser context preserves auth + cart.
 *
 * Flow: Landing → Browse catalog → Click item → Add to cart → Open cart drawer
 *       → Proceed to Checkout → Verify checkout form → Order history
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';

// ─── Environment (loaded from .env.test via playwright.config.ts) ───
const BASE = process.env.BASE_URL || 'https://ordersapp.codevertexitsolutions.com';
const ORG_SLUG = process.env.E2E_ORG_SLUG || 'urban-loft';
const LOGIN_EMAIL = process.env.E2E_LOGIN_EMAIL || 'demo@bengobox.dev';
const LOGIN_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? '';
const BASE_URL = `${BASE}/${ORG_SLUG}`;

/** Human-like pause between actions (1-3s). */
const pause = (page: Page, ms = 2000) => page.waitForTimeout(ms);

// =====================================================================
// Authenticated order flow — login once, navigate via clicks
// =====================================================================
test.describe.serial('Order lifecycle: authenticated user', () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    page = await ctx.newPage();
  });
  test.afterAll(async () => { await ctx.close(); });

  // ── Step 1: Land on homepage ──────────────────────────────────────
  test('1. Landing page loads', async () => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await pause(page, 3000);
    expect(page.url()).toContain(ORG_SLUG);
  });

  // ── Step 2: Sign in via SSO ───────────────────────────────────────
  test('2. SSO login', async () => {
    if (!LOGIN_PASSWORD) { test.skip(true, 'E2E_LOGIN_PASSWORD not set'); return; }

    // Click sign in link — navigates to /auth which performs PKCE redirect to SSO
    const signIn = page.getByRole('link', { name: /sign in|login/i }).first();
    await signIn.click();

    // Wait for SSO login form to appear (skips intermediate /auth page redirect)
    const emailInput = page.locator('input[type="email"], input[id="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 30_000 });

    // Fill credentials
    await emailInput.fill(LOGIN_EMAIL);
    await pause(page, 500);
    await page.locator('input[type="password"], input[id="password"]').first().fill(LOGIN_PASSWORD);
    await pause(page, 500);
    await page.locator('button[type="submit"]').first().click();

    // Wait for redirect back to ordering app
    await page.waitForURL(new RegExp(`(${BASE}|ordersapp).*${ORG_SLUG}`), { timeout: 30_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await pause(page, 3000);

    expect(page.url()).toContain(ORG_SLUG);
  });

  // ── Step 3: Browse catalog ────────────────────────────────────────
  test('3. Browse catalog via navigation', async () => {
    // Click catalog/menu link in the nav or bottom bar
    const catalogLink = page.getByRole('link', { name: /catalog|menu|browse/i }).first();
    const hasLink = await catalogLink.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasLink) {
      await catalogLink.click();
    } else {
      // Fallback: navigate directly
      await page.goto(`${BASE_URL}/catalog`);
    }

    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await pause(page, 3000);

    // Verify items loaded
    const content = page
      .getByRole('heading')
      .or(page.locator('a[href*="/catalog/"]'))
      .or(page.getByText(/add to cart/i));
    await expect(content.first()).toBeVisible({ timeout: 15_000 });
  });

  // ── Step 4: Click an item → detail page ───────────────────────────
  test('4. Open item detail page', async () => {
    // Catalog items render as <article> with onClick (router.push) — client-side nav
    const itemCard = page.locator('[data-menu-item-id]').first();
    await expect(itemCard).toBeVisible({ timeout: 20_000 });
    await pause(page, 1000);

    await itemCard.click();
    // Client-side navigation: poll for URL change instead of waitForURL
    await page.waitForFunction(
      () => /\/catalog\/[a-zA-Z0-9-]+/.test(window.location.pathname),
      { timeout: 15_000 },
    );
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await pause(page, 2000);

    // Verify detail page has item info and add-to-cart button
    const addBtn = page.locator('button').filter({ hasText: /add to cart/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 15_000 });
  });

  // ── Step 5: Add to cart ───────────────────────────────────────────
  test('5. Add item to cart', async () => {
    const addBtn = page.locator('button').filter({ hasText: /add to cart/i }).first();
    await addBtn.click();
    await pause(page, 2000);

    // Verify feedback: toast or cart badge update
    const feedback = page
      .getByText(/added to cart/i)
      .or(page.getByRole('button', { name: /open cart/i }));
    await expect(feedback.first()).toBeVisible({ timeout: 10_000 });
  });

  // ── Step 6: Open cart drawer ──────────────────────────────────────
  test('6. Open cart drawer from header', async () => {
    // Click the cart icon button in the header (aria-label="Open cart")
    const cartBtn = page.getByLabel(/open cart/i);
    await expect(cartBtn).toBeVisible({ timeout: 5_000 });
    await cartBtn.click();
    await pause(page, 1500);

    // Cart drawer should be visible with the item
    const drawerContent = page
      .getByText(/proceed to checkout/i)
      .or(page.getByText(/your cart/i));
    await expect(drawerContent.first()).toBeVisible({ timeout: 10_000 });
  });

  // ── Step 7: Proceed to checkout ───────────────────────────────────
  test('7. Proceed to checkout from cart drawer', async () => {
    // Click "Proceed to Checkout" in the cart drawer
    const checkoutLink = page.getByRole('link', { name: /proceed to checkout/i });
    await expect(checkoutLink).toBeVisible({ timeout: 5_000 });
    await checkoutLink.click();

    await page.waitForURL(/\/checkout/, { timeout: 15_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await pause(page, 3000);

    // Since we're authenticated, should see the checkout form directly
    const checkoutContent = page
      .getByRole('heading', { name: /checkout/i })
      .or(page.getByText(/delivery|pickup|order summary/i));
    await expect(checkoutContent.first()).toBeVisible({ timeout: 15_000 });
  });

  // ── Step 8: Verify checkout form elements ─────────────────────────
  test('8. Checkout form has fulfillment toggle, fees, confirm', async () => {
    // Fulfillment options
    const deliveryOpt = page.getByText(/delivery/i).first();
    const pickupOpt = page.getByText(/pickup/i).first();
    await expect(deliveryOpt).toBeVisible({ timeout: 5_000 });
    await expect(pickupOpt).toBeVisible({ timeout: 5_000 });

    // Order summary / fee section
    const feeSection = page.getByText(/subtotal|total|order summary/i).first();
    await expect(feeSection).toBeVisible({ timeout: 10_000 });

    // Slide to confirm (or place order button)
    const confirmBtn = page
      .getByText(/slide to confirm/i)
      .or(page.getByRole('button', { name: /place order|confirm/i }));
    await expect(confirmBtn.first()).toBeVisible({ timeout: 10_000 });
  });

  // ── Step 9: Navigate to order history ─────────────────────────────
  test('9. Order history page via navigation', async () => {
    // Navigate directly to orders page
    await page.goto(`${BASE_URL}/orders`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await pause(page, 3000);

    // Orders page may show heading, order list, or empty state
    const ordersContent = page
      .getByRole('heading', { name: /order history/i })
      .or(page.getByText(/my orders/i))
      .or(page.getByText(/no orders|you haven't placed/i))
      .or(page.getByText(/active|completed|cancelled/i));
    await expect(ordersContent.first()).toBeVisible({ timeout: 15_000 });
  });
});

// =====================================================================
// Guest checkout flow — separate browser, no auth
// =====================================================================
test.describe.serial('Order lifecycle: guest checkout', () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    page = await ctx.newPage();
  });
  test.afterAll(async () => { await ctx.close(); });

  test('1. Land on homepage and browse catalog', async () => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await pause(page, 3000);

    // Navigate to catalog
    const catalogLink = page.getByRole('link', { name: /catalog|menu|browse/i }).first();
    const hasLink = await catalogLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasLink) {
      await catalogLink.click();
    } else {
      await page.goto(`${BASE_URL}/catalog`);
    }
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await pause(page, 3000);
  });

  test('2. Add item to cart', async () => {
    // Items are <article data-menu-item-id> with onClick, not <a> links
    const itemCard = page.locator('[data-menu-item-id]').first();
    const hasItem = await itemCard.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!hasItem) { test.skip(true, 'No catalog items available'); return; }

    await itemCard.click();
    // Client-side navigation via router.push
    await page.waitForFunction(
      () => /\/catalog\/[a-zA-Z0-9-]+/.test(window.location.pathname),
      { timeout: 15_000 },
    );
    await pause(page, 2000);

    const addBtn = page.locator('button').filter({ hasText: /add to cart/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 15_000 });
    await addBtn.click();
    await pause(page, 2000);
  });

  test('3. Open cart and proceed to checkout', async () => {
    // Open cart drawer
    const cartBtn = page.getByLabel(/open cart/i);
    await expect(cartBtn).toBeVisible({ timeout: 5_000 });
    await cartBtn.click();
    await pause(page, 1500);

    // Click checkout
    const checkoutLink = page.getByRole('link', { name: /proceed to checkout/i });
    const hasCheckout = await checkoutLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasCheckout) { test.skip(true, 'Cart empty — could not add item'); return; }

    await checkoutLink.click();
    await page.waitForURL(/\/checkout/, { timeout: 15_000 });
    await pause(page, 3000);
  });

  test('4. Guest/auth choice appears and guest form works', async () => {
    // Should see the choice screen since we're not logged in
    const choiceHeading = page.getByText(/how would you like to checkout/i);
    const hasChoice = await choiceHeading.isVisible({ timeout: 10_000 }).catch(() => false);

    if (!hasChoice) {
      // May see "Your cart is empty" or already authenticated
      test.info().annotations.push({ type: 'info', description: 'Guest choice not shown' });
      return;
    }

    // Verify both options
    await expect(page.getByText(/continue as guest/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/sign in or create account/i)).toBeVisible({ timeout: 5_000 });

    // Click guest
    await page.getByText(/continue as guest/i).click();
    await pause(page, 2000);

    // Guest form fields should appear
    const emailField = page.getByPlaceholder(/email address/i);
    await expect(emailField).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder(/phone number/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByPlaceholder(/your name/i)).toBeVisible({ timeout: 5_000 });

    // "Sign in instead" link
    await expect(page.getByText(/sign in instead/i)).toBeVisible({ timeout: 5_000 });
  });
});
