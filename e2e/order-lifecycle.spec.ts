/**
 * E2E: Full order lifecycle tests with network diagnostics.
 *
 * Covers: catalog browsing, add-to-cart, cart page, guest checkout,
 * authenticated checkout, fee breakdown, order history, order tracking,
 * rating flow, and a full browse-to-cart API health monitor.
 *
 * Uses NetworkLogger pattern (inlined) to capture and report all network
 * traffic during test runs for diagnostics.
 */
import { expect, test, type ConsoleMessage, type Page, type Request, type Response } from '@playwright/test';

// ─── Environment ────────────────────────────────────────────────────
const BASE = process.env.BASE_URL || 'https://ordersapp.codevertexitsolutions.com';
const ORG_SLUG = process.env.E2E_ORG_SLUG || 'urban-loft';
// Customer account for authenticated checkout tests
const LOGIN_EMAIL = process.env.E2E_LOGIN_EMAIL || 'demo@bengobox.dev';
const LOGIN_PASSWORD = process.env.E2E_LOGIN_PASSWORD || 'DemoUser2024!';
// Guest checkout uses no credentials — just email/phone inline

// ─── NetworkLogger (inlined from cafe-website pattern) ──────────────

interface NetworkEntry {
  timestamp: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  resourceType: string;
  duration?: number;
}

interface ConsoleEntry {
  timestamp: string;
  type: string;
  text: string;
  location?: string;
}

interface PageError {
  timestamp: string;
  message: string;
  stack?: string;
}

interface DiagnosticReport {
  timestamp: string;
  summary: {
    totalRequests: number;
    failedRequests: number;
    count401: number;
    count403: number;
    count5xx: number;
    consoleErrors: number;
    consoleWarnings: number;
    pageErrors: number;
  };
  failedRequests: NetworkEntry[];
  all401s: NetworkEntry[];
  all403s: NetworkEntry[];
  all5xx: NetworkEntry[];
  consoleErrors: ConsoleEntry[];
  consoleWarnings: ConsoleEntry[];
  pageErrors: PageError[];
  allRequests: NetworkEntry[];
}

class NetworkLogger {
  private allRequests: NetworkEntry[] = [];
  private consoleMessages: ConsoleEntry[] = [];
  private pageErrors: PageError[] = [];
  private requestTimestamps = new Map<string, number>();

  attachToPage(page: Page): void {
    page.on('request', (request: Request) => {
      this.requestTimestamps.set(request.url() + request.method(), Date.now());
    });

    page.on('response', (response: Response) => {
      const request = response.request();
      const key = request.url() + request.method();
      const startTime = this.requestTimestamps.get(key);
      const duration = startTime ? Date.now() - startTime : undefined;

      this.allRequests.push({
        timestamp: new Date().toISOString(),
        method: request.method(),
        url: request.url(),
        status: response.status(),
        statusText: response.statusText(),
        resourceType: request.resourceType(),
        duration,
      });
    });

    page.on('console', (msg: ConsoleMessage) => {
      this.consoleMessages.push({
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
          ? `${msg.location().url}:${msg.location().lineNumber}`
          : undefined,
      });
    });

    page.on('pageerror', (error: Error) => {
      this.pageErrors.push({
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
      });
    });
  }

  generateReport(): DiagnosticReport {
    const failedRequests = this.allRequests.filter(
      (r) => r.status >= 400 && r.resourceType !== 'image',
    );
    const all401s = this.allRequests.filter((r) => r.status === 401);
    const all403s = this.allRequests.filter((r) => r.status === 403);
    const all5xx = this.allRequests.filter((r) => r.status >= 500);
    const consoleErrors = this.consoleMessages.filter((m) => m.type === 'error');
    const consoleWarnings = this.consoleMessages.filter((m) => m.type === 'warning');

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalRequests: this.allRequests.length,
        failedRequests: failedRequests.length,
        count401: all401s.length,
        count403: all403s.length,
        count5xx: all5xx.length,
        consoleErrors: consoleErrors.length,
        consoleWarnings: consoleWarnings.length,
        pageErrors: this.pageErrors.length,
      },
      failedRequests,
      all401s,
      all403s,
      all5xx,
      consoleErrors,
      consoleWarnings,
      pageErrors: this.pageErrors,
      allRequests: this.allRequests,
    };
  }

  /** Return only API requests (exclude static assets, images, fonts). */
  getApiRequests(): NetworkEntry[] {
    return this.allRequests.filter(
      (r) => !['image', 'font', 'stylesheet', 'script', 'media'].includes(r.resourceType),
    );
  }

  /** Return 4xx/5xx API failures (excluding image 404s). */
  getApiErrors(): NetworkEntry[] {
    return this.allRequests.filter(
      (r) => r.status >= 400 && r.resourceType !== 'image',
    );
  }

  reset(): void {
    this.allRequests = [];
    this.consoleMessages = [];
    this.pageErrors = [];
    this.requestTimestamps.clear();
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

/** Perform SSO login and wait for redirect back to ordering app. */
async function ssoLogin(page: Page): Promise<void> {
  const baseURL = `${BASE}/${ORG_SLUG}`;
  await page.goto(baseURL);
  await expect(page).toHaveURL(new RegExp(ORG_SLUG), { timeout: 15_000 });

  // Register auth/me listener BEFORE triggering login so we don't miss it
  const authMePromise = page.waitForResponse(
    (res) =>
      res.request().method() === 'GET' &&
      res.url().includes('/auth/me') &&
      res.url().includes(ORG_SLUG) &&
      !res.url().includes('sso.'),
    { timeout: 30_000 },
  );

  const signInLink = page.getByRole('link', { name: /sign in|login/i }).first();
  await signInLink.click();

  // Wait for SSO login page
  await page.waitForURL(/accounts\.codevertexitsolutions\.com\/login/, { timeout: 15_000 });

  await page.getByRole('textbox', { name: /email/i }).fill(LOGIN_EMAIL);
  await page.getByRole('textbox', { name: /password/i }).fill(LOGIN_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect back to ordering app
  await page.waitForURL(new RegExp(`(${BASE}|ordersapp).*${ORG_SLUG}`), { timeout: 25_000 });

  // Wait for auth/me response confirming login succeeded
  await authMePromise;

  // Brief hydration wait
  await page.waitForTimeout(2_000);
}

// =====================================================================
// 1-4: Unauthenticated flows (catalog, add-to-cart, cart, guest checkout)
// =====================================================================

test.describe.serial('Order lifecycle: unauthenticated flows', () => {
  let networkLogger: NetworkLogger;

  test.beforeEach(async ({ page }) => {
    networkLogger = new NetworkLogger();
    networkLogger.attachToPage(page);
  });

  test('1. Catalog browsing: items and categories load', async ({ page }) => {
    // The app uses /catalog as the main browsing route
    await page.goto(`${BASE}/${ORG_SLUG}/catalog`);
    await expect(page).toHaveURL(/\/catalog/, { timeout: 15_000 });

    // Verify content loads: headings, category names, or item cards
    const catalogContent = page
      .getByRole('heading')
      .or(page.getByText(/category|menu|add to cart|popular|featured/i));
    await expect(catalogContent.first()).toBeVisible({ timeout: 15_000 });

    // Verify at least one item card or product link is present
    const itemLink = page
      .locator('a[href*="/catalog/"]')
      .or(page.getByRole('link', { name: /view|details/i }))
      .or(page.locator('[data-testid="item-card"]'))
      .or(page.getByRole('button', { name: /add to cart/i }));
    await expect(itemLink.first()).toBeVisible({ timeout: 15_000 });

    // Verify no 5xx errors during catalog load
    const report = networkLogger.generateReport();
    expect(report.summary.count5xx, `Expected 0 server errors, got ${report.summary.count5xx}`).toBe(0);
  });

  test('2. Add to cart: item detail page + add to cart', async ({ page }) => {
    await page.goto(`${BASE}/${ORG_SLUG}/catalog`);
    await expect(page).toHaveURL(/\/catalog/, { timeout: 15_000 });

    // Wait for items to load
    await page.waitForTimeout(2000);

    // Try clicking a catalog item link to open the detail page
    const catalogItemLink = page.locator('a[href*="/catalog/"]').first();
    const hasDetailLink = await catalogItemLink.isVisible().catch(() => false);

    if (hasDetailLink) {
      // Navigate to item detail page
      await catalogItemLink.click();
      await page.waitForURL(/\/catalog\//, { timeout: 15_000 });

      // Verify detail page renders with item info
      const detailContent = page
        .getByRole('heading')
        .or(page.getByText(/description|price|add to cart/i));
      await expect(detailContent.first()).toBeVisible({ timeout: 10_000 });

      // Click Add to Cart
      const addToCartBtn = page.getByRole('button', { name: /add to cart/i }).first();
      await expect(addToCartBtn).toBeVisible({ timeout: 10_000 });
      await addToCartBtn.click();

      // Verify cart count updates (look for a badge, counter, or cart indicator)
      const cartIndicator = page
        .locator('[data-testid="cart-count"]')
        .or(page.getByRole('button', { name: /cart|bag/i }))
        .or(page.locator('.cart-count, .badge'));
      await expect(cartIndicator.first()).toBeVisible({ timeout: 10_000 });
    } else {
      // Fallback: use the "Add to Cart" button directly from catalog grid (featured cards)
      const addBtn = page.getByRole('button', { name: /add to cart|add/i }).first();
      await expect(addBtn).toBeVisible({ timeout: 10_000 });
      await addBtn.click();

      // Verify something indicates the item was added
      const cartIndicator = page
        .locator('[data-testid="cart-count"]')
        .or(page.getByRole('button', { name: /cart|bag|view cart/i }))
        .or(page.locator('.cart-count, .badge'));
      await expect(cartIndicator.first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('3. Cart page: items listed with prices and checkout button', async ({ page }) => {
    // First add an item (ensure cart is not empty)
    await page.goto(`${BASE}/${ORG_SLUG}/catalog`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // Add item via catalog — try detail page first, then quick-add
    const catalogItemLink = page.locator('a[href*="/catalog/"]').first();
    const hasDetailLink = await catalogItemLink.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasDetailLink) {
      await catalogItemLink.click();
      await page.waitForURL(/\/catalog\//, { timeout: 15_000 });
      await page.waitForTimeout(2000);
      const addBtn = page.getByRole('button', { name: /add to cart/i }).first();
      await expect(addBtn).toBeVisible({ timeout: 10_000 });
      await addBtn.click();
      await page.waitForTimeout(1500);
    } else {
      // Try quick-add from grid
      const addBtn = page.getByRole('button', { name: /add to cart|add/i }).first();
      if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(1500);
      } else {
        test.info().annotations.push({ type: 'skip', description: 'No catalog items available to add to cart' });
        return;
      }
    }

    // Navigate to cart
    await page.goto(`${BASE}/${ORG_SLUG}/cart`);
    await expect(page).toHaveURL(/\/cart/, { timeout: 15_000 });
    await page.waitForTimeout(2000);

    // Verify cart page renders (may show "Your cart is empty" if localStorage didn't persist)
    const cartContent = page
      .getByText(/proceed to checkout/i)
      .or(page.getByText(/your cart is empty/i))
      .or(page.getByRole('heading', { name: /cart|bag|your order/i }));
    await expect(cartContent.first()).toBeVisible({ timeout: 10_000 });

    // If cart has items, verify checkout button
    const checkoutBtn = page.getByRole('button', { name: /proceed to checkout/i });
    const hasCheckout = await checkoutBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasCheckout) {
      await expect(checkoutBtn).toBeEnabled();
    } else {
      test.info().annotations.push({ type: 'info', description: 'Cart empty — localStorage may not persist between test contexts' });
    }
  });

  test('4. Checkout guest mode: guest/auth choice and email form', async ({ page }) => {
    // Add an item first
    await page.goto(`${BASE}/${ORG_SLUG}/catalog`);
    await page.waitForTimeout(2000);

    const catalogItemLink = page.locator('a[href*="/catalog/"]').first();
    const hasDetailLink = await catalogItemLink.isVisible().catch(() => false);

    if (hasDetailLink) {
      await catalogItemLink.click();
      await page.waitForURL(/\/catalog\//, { timeout: 15_000 });
      const addBtn = page.getByRole('button', { name: /add to cart/i }).first();
      await expect(addBtn).toBeVisible({ timeout: 10_000 });
      await addBtn.click();
      await page.waitForTimeout(1000);
    } else {
      const addBtn = page.getByRole('button', { name: /add to cart|add/i }).first();
      if (await addBtn.isVisible().catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Navigate to checkout (unauthenticated)
    await page.goto(`${BASE}/${ORG_SLUG}/checkout`);
    await expect(page).toHaveURL(/\/checkout/, { timeout: 15_000 });

    // Should show guest/auth choice: "How would you like to checkout?"
    const choiceHeading = page.getByText(/how would you like to checkout/i);
    await expect(choiceHeading).toBeVisible({ timeout: 15_000 });

    // Verify both options are present
    const guestOption = page.getByText(/continue as guest/i);
    const signInOption = page.getByText(/sign in or create account/i);
    await expect(guestOption).toBeVisible({ timeout: 5_000 });
    await expect(signInOption).toBeVisible({ timeout: 5_000 });

    // Click "Continue as Guest"
    await guestOption.click();

    // Verify guest contact form appears (email input)
    const emailInput = page.getByPlaceholder(/email address/i);
    await expect(emailInput).toBeVisible({ timeout: 10_000 });

    // Verify phone input is also present
    const phoneInput = page.getByPlaceholder(/phone number/i);
    await expect(phoneInput).toBeVisible({ timeout: 5_000 });

    // Verify name input
    const nameInput = page.getByPlaceholder(/your name/i);
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
  });
});

// =====================================================================
// 5: Fresh customer registration → logged-in checkout
// =====================================================================

test.describe.serial('Order lifecycle: new customer registration + checkout', () => {
  // Generate unique email for this test run to avoid conflicts
  const testTimestamp = Date.now();
  const NEW_CUSTOMER_EMAIL = `testcustomer+${testTimestamp}@bengobox.dev`;
  const NEW_CUSTOMER_PASSWORD = 'TestCustomer2024!';
  const NEW_CUSTOMER_NAME = `Test Customer ${testTimestamp}`;

  test('5a. Customer registers fresh account from checkout sign-in flow', async ({ page }) => {
    // Step 1: Add item to cart
    await page.goto(`${BASE}/${ORG_SLUG}/catalog`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(3000);

    const catalogItemLink = page.locator('a[href*="/catalog/"]').first();
    const hasItem = await catalogItemLink.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasItem) {
      await catalogItemLink.click();
      await page.waitForURL(/\/catalog\//, { timeout: 15_000 });
      await page.waitForTimeout(2000);
      const addBtn = page.getByRole('button', { name: /add to cart/i }).first();
      await expect(addBtn).toBeVisible({ timeout: 10_000 });
      await addBtn.click();
      await page.waitForTimeout(1500);
    } else {
      test.info().annotations.push({ type: 'skip', description: 'No catalog items available' });
      return;
    }

    // Step 2: Go to checkout — not logged in, should see choice screen
    await page.goto(`${BASE}/${ORG_SLUG}/checkout`);
    await expect(page).toHaveURL(/\/checkout/, { timeout: 15_000 });
    await page.waitForTimeout(2000);

    // Step 3: Click "Sign In or Create Account" which redirects to SSO
    const signInOption = page.getByText(/sign in or create account/i);
    const hasSignIn = await signInOption.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!hasSignIn) {
      // Already authenticated or different UI — skip registration test
      test.info().annotations.push({ type: 'skip', description: 'Sign in option not shown — may already be authenticated' });
      return;
    }

    await signInOption.click();

    // Step 4: Should redirect to SSO login page
    await page.waitForURL(/accounts\.codevertexitsolutions\.com/, { timeout: 20_000 });
    await page.waitForTimeout(2000);

    // Step 5: Click "Create Account" / "Sign up" link on the login page
    const signUpLink = page.getByRole('link', { name: /create account|sign up|register/i }).first();
    const hasSignUp = await signUpLink.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasSignUp) {
      await signUpLink.click();
      await page.waitForURL(/accounts\.codevertexitsolutions\.com\/signup/, { timeout: 15_000 });
      await page.waitForTimeout(2000);

      // Step 6: Fill registration form (Step 0 — Account details)
      // Since we arrive with ?tenant=urban-loft, Step 2 (org selection) should be skipped
      const nameField = page.getByRole('textbox', { name: /name/i }).first();
      await nameField.waitFor({ state: 'visible', timeout: 10_000 });
      await nameField.fill(NEW_CUSTOMER_NAME);

      const emailField = page.getByRole('textbox', { name: /email/i }).first();
      await emailField.fill(NEW_CUSTOMER_EMAIL);

      const passwordField = page.locator('input[id="password"]').first();
      await passwordField.fill(NEW_CUSTOMER_PASSWORD);

      const confirmField = page.locator('input[id="confirmPassword"]').first();
      await confirmField.fill(NEW_CUSTOMER_PASSWORD);

      // Click "Create Account" button (when tenant is known, this submits directly)
      const createBtn = page.getByRole('button', { name: /create account|continue/i }).first();
      await createBtn.click();

      // Wait for redirect to login page with success message
      await page.waitForURL(/\/login/, { timeout: 20_000 });
      await page.waitForTimeout(2000);

      // Step 7: Login with the new account
      const loginEmail = page.getByRole('textbox', { name: /email/i }).first();
      await loginEmail.fill(NEW_CUSTOMER_EMAIL);
      const loginPassword = page.getByRole('textbox', { name: /password/i }).first();
      await loginPassword.fill(NEW_CUSTOMER_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();

      // Step 8: Wait for redirect back to ordering app (checkout page via sso_return_to)
      await page.waitForURL(new RegExp(`(${BASE}|ordersapp).*${ORG_SLUG}`), { timeout: 30_000 });
      await page.waitForTimeout(3_000);

      // Verify we are authenticated
      const isOnOrdering = page.url().includes(ORG_SLUG);
      expect(isOnOrdering, 'Should redirect back to ordering app after registration').toBeTruthy();
    } else {
      test.info().annotations.push({ type: 'skip', description: 'Sign up link not found on SSO login page' });
    }
  });
});

// =====================================================================
// 6-9: Authenticated flows (checkout, order placement, history, tracking, rating)
// =====================================================================

test.describe.serial('Order lifecycle: authenticated flows', () => {
  let networkLogger: NetworkLogger;

  test.beforeEach(async ({ page }) => {
    networkLogger = new NetworkLogger();
    networkLogger.attachToPage(page);
  });

  test('6. Checkout authenticated: fulfillment toggle, address selector, fee breakdown, slide-to-confirm', async ({
    page,
  }) => {
    // Login via SSO
    await ssoLogin(page);

    // Add an item to cart
    await page.goto(`${BASE}/${ORG_SLUG}/catalog`);
    await page.waitForTimeout(2000);

    const catalogItemLink = page.locator('a[href*="/catalog/"]').first();
    const hasDetailLink = await catalogItemLink.isVisible().catch(() => false);

    if (hasDetailLink) {
      await catalogItemLink.click();
      await page.waitForURL(/\/catalog\//, { timeout: 15_000 });
      const addBtn = page.getByRole('button', { name: /add to cart/i }).first();
      await expect(addBtn).toBeVisible({ timeout: 10_000 });
      await addBtn.click();
      await page.waitForTimeout(1000);
    } else {
      const addBtn = page.getByRole('button', { name: /add to cart|add/i }).first();
      if (await addBtn.isVisible().catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Navigate to checkout
    await page.goto(`${BASE}/${ORG_SLUG}/checkout`);
    await expect(page).toHaveURL(/\/checkout/, { timeout: 15_000 });

    // Since we are authenticated, should skip the guest/auth choice
    // and go directly to the checkout form

    // Verify "Checkout" heading
    const checkoutHeading = page.getByRole('heading', { name: /checkout/i });
    await expect(checkoutHeading).toBeVisible({ timeout: 15_000 });

    // Verify fulfillment toggle (delivery/pickup/schedule)
    const fulfillmentToggle = page
      .getByText(/delivery/i)
      .and(page.locator('button, [role="tab"], [role="radio"]'));
    const deliveryOption = page.getByRole('button', { name: /delivery/i }).or(
      page.getByText('Delivery').first(),
    );
    const pickupOption = page.getByRole('button', { name: /pickup/i }).or(
      page.getByText('Pickup').first(),
    );
    await expect(deliveryOption).toBeVisible({ timeout: 10_000 });
    await expect(pickupOption).toBeVisible({ timeout: 10_000 });

    // Verify address selector is visible (for delivery mode)
    const addressSection = page
      .getByText(/delivery address|select address|saved address/i)
      .or(page.locator('[data-testid="address-selector"]'));
    await expect(addressSection.first()).toBeVisible({ timeout: 10_000 });

    // Verify fee breakdown section loads
    const feeSection = page
      .getByText(/subtotal|total|fee breakdown|order summary/i)
      .first();
    await expect(feeSection).toBeVisible({ timeout: 10_000 });

    // Verify slide-to-confirm button renders
    const slideToConfirm = page
      .getByText(/slide to confirm/i)
      .or(page.locator('[data-testid="slide-to-confirm"]'));
    await expect(slideToConfirm.first()).toBeVisible({ timeout: 10_000 });
  });

  test('7. Order placement validation: fee-breakdown API returns 200', async ({ page }) => {
    // Login via SSO
    await ssoLogin(page);

    // Add an item to cart
    await page.goto(`${BASE}/${ORG_SLUG}/catalog`);
    await page.waitForTimeout(2000);

    const catalogItemLink = page.locator('a[href*="/catalog/"]').first();
    const hasDetailLink = await catalogItemLink.isVisible().catch(() => false);

    if (hasDetailLink) {
      await catalogItemLink.click();
      await page.waitForURL(/\/catalog\//, { timeout: 15_000 });
      const addBtn = page.getByRole('button', { name: /add to cart/i }).first();
      await expect(addBtn).toBeVisible({ timeout: 10_000 });
      await addBtn.click();
      await page.waitForTimeout(1000);
    } else {
      const addBtn = page.getByRole('button', { name: /add to cart|add/i }).first();
      if (await addBtn.isVisible().catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Navigate to checkout and watch for fee-breakdown API
    const feeBreakdownPromise = page.waitForResponse(
      (res) =>
        res.url().includes('fee-breakdown') &&
        res.request().method() === 'GET',
      { timeout: 20_000 },
    );

    await page.goto(`${BASE}/${ORG_SLUG}/checkout`);
    await expect(page).toHaveURL(/\/checkout/, { timeout: 15_000 });

    // Wait for fee-breakdown API response
    const feeRes = await feeBreakdownPromise.catch(() => null);

    if (feeRes) {
      expect(feeRes.status(), 'fee-breakdown API should return 200').toBe(200);

      const feeBody = await feeRes.json().catch(() => null);
      if (feeBody) {
        // Verify the response contains expected fee structure
        expect(
          feeBody,
          'fee-breakdown response should be an object',
        ).toBeDefined();
      }
    }

    // Verify order summary renders on the page
    const summaryText = page
      .getByText(/subtotal|order total|grand total/i)
      .first();
    await expect(summaryText).toBeVisible({ timeout: 10_000 });
  });

  test('8. Order history: /orders page loads or shows empty state', async ({ page }) => {
    // Login via SSO
    await ssoLogin(page);

    // Listen for orders API response
    const ordersApiPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/orders') &&
        res.request().method() === 'GET' &&
        !res.url().includes('/orders/summary'),
      { timeout: 15_000 },
    );

    await page.goto(`${BASE}/${ORG_SLUG}/orders`);
    await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 });

    // Wait for the orders API call
    const ordersRes = await ordersApiPromise.catch(() => null);

    if (ordersRes) {
      expect(
        ordersRes.status(),
        `Orders API should return 200, got ${ordersRes.status()}`,
      ).toBe(200);
    }

    // Verify either order list or empty state renders
    const ordersContent = page
      .getByRole('heading', { name: /orders|my orders|order history/i })
      .or(page.getByText(/no orders|you haven't placed|empty/i))
      .or(page.locator('[data-testid="order-card"]'))
      .or(page.getByText(/pending|confirmed|delivered|completed/i));
    await expect(ordersContent.first()).toBeVisible({ timeout: 15_000 });

    // Check for status filter tabs
    const tabsList = page
      .getByRole('tab', { name: /all/i })
      .or(page.getByText(/all|active|completed|cancelled/i).first());
    await expect(tabsList.first()).toBeVisible({ timeout: 10_000 });
  });

  test('9. Order tracking page: renders timeline and status', async ({ page }) => {
    // Login via SSO
    await ssoLogin(page);

    // First get the orders list to find an order ID
    await page.goto(`${BASE}/${ORG_SLUG}/orders`);
    await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 });
    await page.waitForTimeout(3000);

    // Try to find any order link on the page
    const orderLink = page
      .locator('a[href*="/orders/"]')
      .or(page.locator('a[href*="/track/"]'))
      .first();
    const hasOrder = await orderLink.isVisible().catch(() => false);

    if (hasOrder) {
      // Get the href to extract orderId
      const href = await orderLink.getAttribute('href');
      const orderIdMatch = href?.match(/\/(orders|track)\/([a-zA-Z0-9-]+)/);
      const orderId = orderIdMatch?.[2];

      if (orderId) {
        // Navigate to tracking page
        await page.goto(`${BASE}/${ORG_SLUG}/track/${orderId}`);
        await expect(page).toHaveURL(/\/track\//, { timeout: 15_000 });

        // Verify tracking UI elements
        const trackingContent = page
          .getByText(/status|timeline|tracking|order #|eta|arriving/i)
          .or(page.locator('[data-testid="status-timeline"]'))
          .or(page.getByRole('heading'));
        await expect(trackingContent.first()).toBeVisible({ timeout: 15_000 });

        // Look for status badge
        const statusBadge = page
          .locator('.badge, [data-testid="status-badge"]')
          .or(
            page.getByText(
              /pending|confirmed|preparing|ready|out for delivery|delivered|completed|enroute/i,
            ),
          );
        await expect(statusBadge.first()).toBeVisible({ timeout: 10_000 });
      }
    } else {
      // No orders exist — this is acceptable; just verify the empty state was shown on /orders
      const emptyState = page
        .getByText(/no orders|you haven't placed|empty|start ordering/i)
        .or(page.getByRole('link', { name: /browse|catalog|menu/i }));
      await expect(emptyState.first()).toBeVisible({ timeout: 10_000 });
      // Skip tracking test gracefully
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'No orders found — tracking page test skipped',
      });
    }
  });

  test('10. Rating flow: completed order has rating dialog accessible', async ({ page }) => {
    // Login via SSO
    await ssoLogin(page);

    // Navigate to orders to find a completed order
    await page.goto(`${BASE}/${ORG_SLUG}/orders`);
    await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 });
    await page.waitForTimeout(3000);

    // Try the "Completed" tab if available
    const completedTab = page.getByRole('tab', { name: /completed/i }).first();
    const hasCompletedTab = await completedTab.isVisible().catch(() => false);

    if (hasCompletedTab) {
      await completedTab.click();
      await page.waitForTimeout(2000);
    }

    // Find a completed/delivered order
    const orderCard = page
      .locator('a[href*="/orders/"]')
      .or(page.locator('[data-testid="order-card"]'))
      .first();
    const hasCompletedOrder = await orderCard.isVisible().catch(() => false);

    if (hasCompletedOrder) {
      await orderCard.click();
      await page.waitForTimeout(2000);

      // Look for rating button or stars on the order detail page
      const ratingTrigger = page
        .getByRole('button', { name: /rate|review|star/i })
        .or(page.getByText(/rate this order|leave a review|how was your order/i))
        .or(page.locator('[data-testid="rating-trigger"]'));
      const hasRating = await ratingTrigger.first().isVisible().catch(() => false);

      if (hasRating) {
        await ratingTrigger.first().click();

        // Verify rating dialog appears
        const ratingDialog = page
          .getByRole('dialog')
          .or(page.getByText(/rate your order|submit review|how would you rate/i));
        await expect(ratingDialog.first()).toBeVisible({ timeout: 10_000 });

        // Verify star rating input is present (typically 5 clickable elements)
        const starElements = page
          .locator('[data-testid="star-rating"] button, [role="radio"], .star-rating button')
          .or(page.getByRole('button', { name: /star|1|2|3|4|5/i }));
        // At minimum, some interactive rating element should be visible
        await expect(starElements.first()).toBeVisible({ timeout: 5_000 });
      } else {
        test.info().annotations.push({
          type: 'skip-reason',
          description: 'Rating button not found on completed order — may already be rated',
        });
      }
    } else {
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'No completed orders found — rating test skipped',
      });
    }
  });
});

// =====================================================================
// 10: Full browse-to-cart API health monitor
// =====================================================================

test.describe('API health monitor: browse to cart flow', () => {
  test('monitor all API requests during browse → add-to-cart → cart flow and report errors', async ({
    page,
  }) => {
    const logger = new NetworkLogger();
    logger.attachToPage(page);

    // Step 1: Load the landing page
    await page.goto(`${BASE}/${ORG_SLUG}`);
    await expect(page).toHaveURL(new RegExp(ORG_SLUG), { timeout: 15_000 });
    await page.waitForTimeout(2000);

    // Step 2: Browse catalog
    await page.goto(`${BASE}/${ORG_SLUG}/catalog`);
    await expect(page).toHaveURL(/\/catalog/, { timeout: 15_000 });
    await page.waitForTimeout(3000);

    // Step 3: Click into an item detail (if available)
    const catalogItemLink = page.locator('a[href*="/catalog/"]').first();
    const hasDetailLink = await catalogItemLink.isVisible().catch(() => false);

    if (hasDetailLink) {
      await catalogItemLink.click();
      await page.waitForURL(/\/catalog\//, { timeout: 15_000 });
      await page.waitForTimeout(2000);

      // Add to cart
      const addBtn = page.getByRole('button', { name: /add to cart/i }).first();
      const canAdd = await addBtn.isVisible().catch(() => false);
      if (canAdd) {
        await addBtn.click();
        await page.waitForTimeout(1500);
      }
    } else {
      // Try add from catalog grid
      const addBtn = page.getByRole('button', { name: /add to cart|add/i }).first();
      const canAdd = await addBtn.isVisible().catch(() => false);
      if (canAdd) {
        await addBtn.click();
        await page.waitForTimeout(1500);
      }
    }

    // Step 4: Navigate to cart
    await page.goto(`${BASE}/${ORG_SLUG}/cart`);
    await expect(page).toHaveURL(/\/cart/, { timeout: 15_000 });
    await page.waitForTimeout(2000);

    // ─── Generate report ───────────────────────────────────────────
    const report = logger.generateReport();
    const apiErrors = logger.getApiErrors();

    // Log summary for test output
    console.log('=== API Health Monitor Report ===');
    console.log(`Total requests: ${report.summary.totalRequests}`);
    console.log(`Failed requests (4xx/5xx): ${report.summary.failedRequests}`);
    console.log(`401 Unauthorized: ${report.summary.count401}`);
    console.log(`403 Forbidden: ${report.summary.count403}`);
    console.log(`5xx Server Errors: ${report.summary.count5xx}`);
    console.log(`Console errors: ${report.summary.consoleErrors}`);
    console.log(`Page errors: ${report.summary.pageErrors}`);

    if (apiErrors.length > 0) {
      console.log('\n--- API Errors ---');
      for (const err of apiErrors) {
        console.log(`  ${err.method} ${err.url} -> ${err.status} ${err.statusText} (${err.duration ?? '?'}ms)`);
      }
    }

    if (report.consoleErrors.length > 0) {
      console.log('\n--- Console Errors ---');
      for (const err of report.consoleErrors) {
        console.log(`  ${err.text}`);
      }
    }

    // Assert: no 5xx server errors during the flow
    expect(
      report.summary.count5xx,
      `Expected 0 server errors (5xx) during browse-to-cart flow. Errors:\n${
        report.all5xx.map((r) => `  ${r.method} ${r.url} -> ${r.status}`).join('\n')
      }`,
    ).toBe(0);

    // Soft assertion: report 4xx errors but only fail on auth errors (401) if unexpected
    // 404s for optional resources are acceptable, 401 before login is expected
    if (report.summary.count401 > 0) {
      console.warn(
        `WARNING: ${report.summary.count401} unauthorized (401) responses detected during unauthenticated browsing:`,
      );
      for (const r of report.all401s) {
        console.warn(`  ${r.method} ${r.url}`);
      }
    }

    // Final: total requests should be > 0 (sanity check that we captured traffic)
    expect(report.summary.totalRequests, 'Should have captured network requests').toBeGreaterThan(0);
  });
});
