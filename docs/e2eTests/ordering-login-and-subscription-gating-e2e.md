# Ordering Login and Subscription Gating E2E

**Last updated:** March 2026  
**Specs:** [TRINITY-AUTHORIZATION-PATTERN.md](../../../shared-docs/TRINITY-AUTHORIZATION-PATTERN.md), [sso-integration-guide.md](../../../shared-docs/sso-integration-guide.md)  
**Status:** Implemented (Playwright)

## Overview

E2E tests validate ordering-frontend landing and menu pages for a tenant (default `urban-loft`), and that unauthenticated users can see Sign in / menu content. Subscription gating (redirect to subscribe when status is EXPIRED) and full SSO callback flow can be extended in future specs.

## Preconditions

- **Target:** `https://ordering.codevertexafrica.com` (override via `BASE_URL`)
- **Default tenant:** `urban-loft` (override via `E2E_ORG_SLUG`)
- **Auth:** SSO (auth-api) and OAuth client `ordering-ui` with redirect URI for `/{tenant}/auth/callback`

## Test File

`ordering-frontend/e2e/ordering-login-and-landing.spec.ts`

## Scenarios

### 1. Landing or menu page loads for tenant

- Navigate to `/` (base URL already includes `/{orgSlug}`)
- Assert URL contains tenant slug
- Assert "Sign in" / "Login" link or menu/order content visible

### 2. Unauthenticated user can open menu or see sign in

- Navigate to `/menu`
- Assert URL is `/menu`
- Assert Sign in link or heading visible

## Trinity / Subscription Gating

Per [TRINITY-AUTHORIZATION-PATTERN.md](../../../shared-docs/TRINITY-AUTHORIZATION-PATTERN.md):

- **Post-login:** Frontend should call `GET /api/v1/tenants/{tenant_id}/subscription` (subscription-api); ACTIVE/TRIAL → allow access; EXPIRED/404 → redirect to subscribe.
- **Current coverage:** Landing and menu load; full login → subscription check → redirect to subscribe is a candidate for future E2E (requires subscription-api and seeded subscription state).

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Ordering-frontend origin (without tenant path) | `https://ordering.codevertexafrica.com` |
| `E2E_ORG_SLUG` | Tenant slug used in base URL | `urban-loft` |

## Running

```bash
cd ordering-service/ordering-frontend
pnpm install
pnpm exec playwright install
pnpm test:e2e -- ordering-login-and-landing
```

## Artifacts

| Artifact | Path | Notes |
|----------|------|--------|
| HTML report | `ordering-frontend/playwright-report/index.html` | `npx playwright show-report playwright-report` |
| Screenshots / trace | `ordering-frontend/test-results/<test-name>-chromium/` | On failure or first retry |

## Real run results (March 2026)

Manual run against production `https://ordering.codevertexafrica.com/urban-loft`:

- **Landing:** Pass. Page shows "Order App Food Delivery"; tabs Delivery/Pickup; categories (Restaurants, Grocery, Pizza, etc.); "Open cart", "Sign in", "Browse Menu"; bottom nav Home, Menu, Cart, Orders, Account. Featured Items and Outlets Near You sections present.
- **Sign in / cart:** "Sign in" link and "Open cart" button visible; cart shows "1 Cart" in nav when items added.

## Current Status

- **Pass/Fail:** Run against live ordersapp; depends on deployment and API health.
- **Notes:** Extend with SSO login from ordering-frontend (redirect to accounts → callback → dashboard) and subscription gating assertions when subscription-api is stable.
