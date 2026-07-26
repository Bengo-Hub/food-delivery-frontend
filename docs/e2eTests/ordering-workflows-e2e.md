# Ordering Workflows E2E

**Last updated:** March 2026  
**Specs:** [TRINITY-AUTHORIZATION-PATTERN.md](../../../shared-docs/TRINITY-AUTHORIZATION-PATTERN.md), [sso-integration-guide.md](../../../shared-docs/sso-integration-guide.md)  
**Status:** Implemented (Playwright, partial)

## Overview

E2E tests validate ordering-frontend menu page and cart/checkout entry points. Full flow (add to cart → checkout → payment → order status → tracking → delivery confirmation → rating) can be extended as APIs and test data stabilise.

## Preconditions

- **Target:** `https://ordering.codevertexafrica.com/{tenant}` (default tenant `urban-loft`)
- Ordering-api and menu/catalog data available for the tenant

## Test File

`ordering-frontend/e2e/ordering-workflows.spec.ts`

## Scenarios (Implemented)

### 1. Menu page has categories or items

- Navigate to `/menu`
- Assert URL contains `/menu`
- Assert presence of heading or category/menu/add-to-cart content

### 2. Cart or checkout entry point visible

- Navigate to `/`
- Assert cart button or "View cart" / "Checkout" visible

## Planned Scenarios (Backlog)

- Add item(s) to cart from public menu → transition to authenticated checkout (SSO if needed)
- Complete checkout (treasury integration; mock or assert payment intent network calls)
- Order status transitions (placed → accepted → out_for_delivery → delivered)
- Live tracking (Google Maps iframe/component and marker updates)
- Delivery confirmation and rating submission

## Running

```bash
cd ordering-service/ordering-frontend
pnpm test:e2e -- ordering-workflows
```

## Artifacts

Same as [ordering-login-and-subscription-gating-e2e.md](./ordering-login-and-subscription-gating-e2e.md): `playwright-report/`, `test-results/`.

## Real run results (March 2026)

- **Menu/categories:** Landing at `/urban-loft` shows category buttons and "Featured Items", "Outlets Near You", "Browse Menu".
- **Cart entry:** "Open cart" button and bottom nav "Cart" visible.

## Current Status

- **Pass/Fail:** Run against live app; depends on deployment.
- **Notes:** Cart/checkout and full order flow depend on ordering-api and treasury; extend when backend and test fixtures are ready.
