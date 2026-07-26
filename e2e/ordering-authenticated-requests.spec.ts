/**
 * E2E: Authenticated requests after SSO login (no 401).
 * Covers: (1) SSO GET /api/v1/auth/me when observed; (2) ordering-backend GET /auth/me + body roles/permissions;
 * (3) second service endpoint GET /customers/orders/summary. Confirms user synced locally with correct role/permission mapping.
 * See shared-docs/SSO-AUTHENTICATED-REQUESTS-AND-401.md
 */
import { expect, test } from '@playwright/test';

const BASE = process.env.BASE_URL || 'https://ordering.codevertexafrica.com';
const ORG_SLUG = process.env.E2E_ORG_SLUG || 'urban-loft';
const LOGIN_EMAIL = process.env.E2E_LOGIN_EMAIL || 'demo@bengobox.dev';
const LOGIN_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? '';

function isOrderingAuthMe(url: string): boolean {
  return url.includes('/auth/me') && url.includes(ORG_SLUG) && !url.includes('sso.');
}
function isSSOAuthMe(url: string): boolean {
  return url.includes('sso.') && url.includes('/auth/me');
}
function isOrdersSummary(url: string): boolean {
  return url.includes('customers/orders/summary');
}

test.describe('Ordering: authenticated requests after login', () => {
  test('full SSO login then SSO /me + 2 service endpoints return 200 and /auth/me has roles and permissions', async ({ page }) => {
    const baseURL = `${BASE}/${ORG_SLUG}`;
    await page.goto(baseURL);
    await expect(page).toHaveURL(new RegExp(ORG_SLUG), { timeout: 15_000 });

    // Optional: collect SSO /auth/me if observed (e.g. fallback path)
    let ssoMeResponse: { status: number; body?: unknown } | null = null;
    page.on('response', async (res) => {
      if (res.request().method() === 'GET' && isSSOAuthMe(res.url())) {
        const status = res.status();
        try {
          const body = await res.json().catch(() => ({}));
          ssoMeResponse = { status, body };
        } catch {
          ssoMeResponse = { status };
        }
      }
    });

    // Click Sign in — goes to /auth which auto-redirects to SSO via PKCE
    const signInLink = page.getByRole('link', { name: /sign in|login/i }).first();
    await signInLink.click();

    // Wait for SSO login form to appear (skips intermediate PKCE redirect)
    const emailField = page.locator('input[type="email"], input[id="email"]').first();
    await emailField.waitFor({ state: 'visible', timeout: 30_000 });

    await emailField.fill(LOGIN_EMAIL);
    await page.locator('input[type="password"], input[id="password"]').first().fill(LOGIN_PASSWORD);
    await page.locator('button[type="submit"]').first().click();

    // Wait for redirect back to ordering (callback then dashboard/menu)
    await page.waitForURL(new RegExp(`(${BASE}|ordersapp).*${ORG_SLUG}`), { timeout: 30_000 });

    // Wait for page to fully hydrate after SSO callback
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    // 1) Ordering-backend GET /api/v1/{tenant}/auth/me → 200 and body has user.roles, user.permissions
    const orderingAuthMeRes = await page.waitForResponse(
      (res) => res.request().method() === 'GET' && isOrderingAuthMe(res.url()),
      { timeout: 20_000 }
    ).catch(() => null);
    expect(orderingAuthMeRes, 'Ordering-backend GET /auth/me must be called after login').not.toBeNull();
    if (orderingAuthMeRes) {
      expect(orderingAuthMeRes.status(), 'GET /auth/me must return 200 (no 401)').toBe(200);
      const body = await orderingAuthMeRes.json().catch(() => ({})) as { user?: { roles?: unknown; permissions?: unknown } };
      expect(body.user, 'Response must include user (synced locally)').toBeDefined();
      expect(Array.isArray(body.user?.roles), 'user.roles must be an array (role mapping)').toBe(true);
      expect(Array.isArray(body.user?.permissions), 'user.permissions must be an array (permission mapping)').toBe(true);
    }

    // 2) Second service endpoint: GET /api/v1/{tenant}/customers/orders/summary → 200
    const ordersSummaryRes = await page.waitForResponse(
      (res) => res.request().method() === 'GET' && isOrdersSummary(res.url()),
      { timeout: 10_000 }
    ).catch(() => null);
    expect(ordersSummaryRes, 'GET /customers/orders/summary must be called after profile (hydrateOrders)').not.toBeNull();
    if (ordersSummaryRes) {
      expect(ordersSummaryRes.status(), 'GET /customers/orders/summary must return 200 (no 401)').toBe(200);
    }

    // 3) SSO GET /api/v1/auth/me: if observed (e.g. fallback), assert 200 and roles/permissions
    const capturedSsoMe = ssoMeResponse as { status: number; body?: unknown } | null;
    if (capturedSsoMe !== null) {
      expect(capturedSsoMe.status, 'SSO GET /auth/me must return 200 when called').toBe(200);
      const ssoBody = capturedSsoMe.body as { roles?: unknown; permissions?: unknown } | undefined;
      if (ssoBody) {
        expect(Array.isArray(ssoBody.roles) || typeof ssoBody.roles !== 'undefined', 'SSO /me should include roles').toBeTruthy();
        expect(Array.isArray(ssoBody.permissions) || typeof ssoBody.permissions !== 'undefined', 'SSO /me should include permissions').toBeTruthy();
      }
    }
    // If SSO /me was not observed, it is covered by auth-ui E2E (see ordering-authenticated-requests-e2e.md).
  });
});
