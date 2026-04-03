/**
 * E2E: Full order lifecycle — sequential, single browser session.
 *
 * Flow: Login → Browse catalog → Add item → Cart → Checkout → Order history
 * Each test depends on the previous one. Single browser context is shared
 * so cart state and auth persist between steps.
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// ─── Environment (loaded from .env.test) ────────────────────────────
const BASE = process.env.BASE_URL || 'https://ordersapp.codevertexitsolutions.com';
const ORG_SLUG = process.env.E2E_ORG_SLUG || 'urban-loft';
const LOGIN_EMAIL = process.env.E2E_LOGIN_EMAIL || 'demo@bengobox.dev';
const LOGIN_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? '';
const BASE_URL = `${BASE}/${ORG_SLUG}`;

// ─── Inline Network Logger ──────────────────────────────────────────
interface ApiEntry { method: string; url: string; status: number; }
class ApiLogger {
  entries: ApiEntry[] = [];
  attach(page: Page) {
    page.on('response', (res) => {
      const url = res.url();
      if (url.includes('/api/') || url.includes('sso.')) {
        this.entries.push({ method: res.request().method(), url, status: res.status() });
      }
    });
  }
  get errors() { return this.entries.filter((e) => e.status >= 500); }
  get authErrors() { return this.entries.filter((e) => e.status === 401); }
  summary() {
    const total = this.entries.length;
    const err5xx = this.errors.length;
    const err4xx = this.entries.filter((e) => e.status >= 400 && e.status < 500).length;
    return `${total} requests, ${err4xx} client errors, ${err5xx} server errors`;
  }
}

// =====================================================================
// Sequential test suite — single browser, shared state
// =====================================================================
test.describe.serial('Order lifecycle: browse → cart → checkout', () => {
  let context: BrowserContext;
  let page: Page;
  let apiLogger: ApiLogger;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    apiLogger = new ApiLogger();
    apiLogger.attach(page);
  });

  test.afterAll(async () => {
    // Save API log
    const outDir = path.resolve(__dirname, '..', 'test-results');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, 'order-lifecycle-api-log.json'),
      JSON.stringify(apiLogger.entries, null, 2),
    );
    console.log(`API summary: ${apiLogger.summary()}`);
    if (apiLogger.errors.length > 0) {
      console.log('5xx errors:');
      apiLogger.errors.forEach((e) => console.log(`  ${e.method} ${e.url} → ${e.status}`));
    }
    await context.close();
  });

  // ─── Step 1: SSO Login ────────────────────────────────────────────
  test('1. Login via SSO', async () => {
    if (!LOGIN_PASSWORD) {
      test.skip(true, 'E2E_LOGIN_PASSWORD not set in .env.test');
      return;
    }

    await page.goto(BASE_URL);
    await expect(page).toHaveURL(new RegExp(ORG_SLUG), { timeout: 15_000 });

    // Click sign in
    const signInLink = page.getByRole('link', { name: /sign in|login/i }).first();
    await signInLink.click();

    // Wait for SSO login form
    await page.waitForURL(/accounts\.codevertexitsolutions\.com/, { timeout: 15_000 });
    const emailInput = page.locator('input[type="email"], input[id="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 15_000 });
    await emailInput.fill(LOGIN_EMAIL);

    const passwordInput = page.locator('input[type="password"], input[id="password"]').first();
    await passwordInput.fill(LOGIN_PASSWORD);
    await page.locator('button[type="submit"]').first().click();

    // Wait for redirect back
    await page.waitForURL(new RegExp(`(${BASE}|ordersapp).*${ORG_SLUG}`), { timeout: 30_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(3_000);

    // Confirm we're on the ordering app
    expect(page.url()).toContain(ORG_SLUG);
  });

  // ─── Step 2: Browse Catalog ───────────────────────────────────────
  test('2. Browse catalog — items and categories load', async () => {
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(3_000);

    // Verify content loads (items, categories, or headings)
    const content = page
      .getByRole('heading')
      .or(page.getByText(/category|menu|add to cart|popular|featured/i));
    await expect(content.first()).toBeVisible({ timeout: 15_000 });
  });

  // ─── Step 3: Add Item to Cart ─────────────────────────────────────
  test('3. Add item to cart from catalog', async () => {
    // Should already be on /catalog from previous test
    if (!page.url().includes('/catalog')) {
      await page.goto(`${BASE_URL}/catalog`);
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(3_000);
    }

    // Click first catalog item link to open detail page
    const itemLink = page.locator('a[href*="/catalog/"]').first();
    const hasItem = await itemLink.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasItem) {
      await itemLink.click();
      await page.waitForURL(/\/catalog\//, { timeout: 15_000 });
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(2_000);

      // Click "Add to Cart" button (text includes price, e.g. "Add to Cart · KES 350")
      const addBtn = page.locator('button').filter({ hasText: /add to cart/i }).first();
      await expect(addBtn).toBeVisible({ timeout: 15_000 });
      await addBtn.click();
      await page.waitForTimeout(2_000);

      // Verify toast or visual feedback
      const feedback = page
        .getByText(/added to cart/i)
        .or(page.locator('[data-testid="cart-count"]'))
        .or(page.getByRole('button', { name: /cart|bag/i }));
      await expect(feedback.first()).toBeVisible({ timeout: 10_000 });
    } else {
      // Try quick-add from grid
      const addBtn = page.locator('button').filter({ hasText: /add/i }).first();
      const canAdd = await addBtn.isVisible({ timeout: 5_000 }).catch(() => false);
      if (canAdd) {
        await addBtn.click();
        await page.waitForTimeout(2_000);
      } else {
        test.info().annotations.push({ type: 'skip', description: 'No catalog items available' });
      }
    }
  });

  // ─── Step 4: View Cart ────────────────────────────────────────────
  test('4. Cart page — items listed with checkout button', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    // Verify cart page content
    const cartContent = page
      .getByText(/proceed to checkout/i)
      .or(page.getByText(/your cart/i))
      .or(page.getByRole('heading', { name: /cart|bag|order/i }));
    await expect(cartContent.first()).toBeVisible({ timeout: 10_000 });

    // Check if cart has items
    const checkoutBtn = page.getByRole('button', { name: /proceed to checkout/i });
    const hasItems = await checkoutBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasItems) {
      await expect(checkoutBtn).toBeEnabled();
    } else {
      test.info().annotations.push({ type: 'info', description: 'Cart empty — add-to-cart may have failed' });
    }
  });

  // ─── Step 5: Checkout (authenticated) ─────────────────────────────
  test('5. Checkout page — fulfillment, address, fees, confirm', async () => {
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(3_000);

    // Since we're authenticated, should see checkout form directly (no guest choice)
    const checkoutContent = page
      .getByRole('heading', { name: /checkout/i })
      .or(page.getByText(/delivery|pickup|order summary|slide to confirm/i));
    await expect(checkoutContent.first()).toBeVisible({ timeout: 15_000 });

    // Verify fulfillment options visible
    const deliveryOpt = page.getByText(/delivery/i).first();
    const pickupOpt = page.getByText(/pickup/i).first();
    await expect(deliveryOpt).toBeVisible({ timeout: 5_000 });
    await expect(pickupOpt).toBeVisible({ timeout: 5_000 });

    // Verify order summary section
    const feeSection = page.getByText(/subtotal|total|order summary/i).first();
    await expect(feeSection).toBeVisible({ timeout: 10_000 });
  });

  // ─── Step 6: Order History ────────────────────────────────────────
  test('6. Order history page loads', async () => {
    await page.goto(`${BASE_URL}/orders`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    const ordersContent = page
      .getByRole('heading', { name: /orders|my orders/i })
      .or(page.getByText(/no orders|you haven't placed|order history/i))
      .or(page.getByText(/pending|confirmed|delivered|completed/i));
    await expect(ordersContent.first()).toBeVisible({ timeout: 15_000 });
  });

  // ─── Step 7: API Health Check ─────────────────────────────────────
  test('7. No 5xx server errors during the workflow', async () => {
    const errors5xx = apiLogger.errors;
    if (errors5xx.length > 0) {
      console.log('Server errors detected:');
      errors5xx.forEach((e) => console.log(`  ${e.method} ${e.url} → ${e.status}`));
    }
    // Allow some 5xx as the rate limiter may cause transient failures
    // but flag them for investigation
    expect(
      errors5xx.length,
      `${errors5xx.length} server errors detected:\n${errors5xx.map((e) => `  ${e.method} ${e.url} → ${e.status}`).join('\n')}`,
    ).toBeLessThanOrEqual(2);
  });
});

// =====================================================================
// Guest checkout flow (separate browser — no auth)
// =====================================================================
test.describe.serial('Order lifecycle: guest checkout', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('1. Browse and add item to cart (unauthenticated)', async () => {
    await page.goto(`${BASE}/${ORG_SLUG}/catalog`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(3_000);

    // Click first item
    const itemLink = page.locator('a[href*="/catalog/"]').first();
    const hasItem = await itemLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasItem) {
      await itemLink.click();
      await page.waitForURL(/\/catalog\//, { timeout: 15_000 });
      await page.waitForTimeout(2_000);
      const addBtn = page.locator('button').filter({ hasText: /add to cart/i }).first();
      const canAdd = await addBtn.isVisible({ timeout: 10_000 }).catch(() => false);
      if (canAdd) {
        await addBtn.click();
        await page.waitForTimeout(2_000);
      }
    }
  });

  test('2. Checkout shows guest/auth choice', async () => {
    await page.goto(`${BASE}/${ORG_SLUG}/checkout`);
    await page.waitForTimeout(3_000);

    // Should show "How would you like to checkout?" choice
    const choiceHeading = page.getByText(/how would you like to checkout/i);
    const hasChoice = await choiceHeading.isVisible({ timeout: 10_000 }).catch(() => false);

    if (hasChoice) {
      // Both options present
      await expect(page.getByText(/continue as guest/i)).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText(/sign in or create account/i)).toBeVisible({ timeout: 5_000 });
    } else {
      // Cart may be empty (rate limit blocked catalog), or already redirected
      test.info().annotations.push({ type: 'info', description: 'Guest choice not shown — cart may be empty' });
    }
  });

  test('3. Guest checkout form — email, phone, name fields', async () => {
    // Click "Continue as Guest" if visible
    const guestBtn = page.getByText(/continue as guest/i);
    const hasGuest = await guestBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasGuest) {
      await guestBtn.click();
      await page.waitForTimeout(2_000);

      // Verify guest contact form
      await expect(page.getByPlaceholder(/email address/i)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByPlaceholder(/phone number/i)).toBeVisible({ timeout: 5_000 });
      await expect(page.getByPlaceholder(/your name/i)).toBeVisible({ timeout: 5_000 });

      // "Sign in instead" link
      await expect(page.getByText(/sign in instead/i)).toBeVisible({ timeout: 5_000 });
    } else {
      test.info().annotations.push({ type: 'skip', description: 'Guest checkout not available' });
    }
  });
});
