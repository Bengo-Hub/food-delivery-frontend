# Ordering: Authenticated requests after SSO login (no 401)

**Last updated:** March 2026  
**Specs:** [SSO-AUTHENTICATED-REQUESTS-AND-401.md](../../../shared-docs/SSO-AUTHENTICATED-REQUESTS-AND-401.md), [sso-integration-guide.md](../../../shared-docs/sso-integration-guide.md)  
**Status:** Implemented (Playwright)

## Overview

E2E tests ensure that after a user completes SSO login from the ordering app, **authenticated API requests succeed (200)** and do not return 401. This catches token/tenant attachment bugs and backend validation misconfiguration.

## Real user flow

1. User is on ordering-frontend (e.g. `/{orgSlug}/` or `/menu`).
2. User clicks "Sign in" → redirect to accounts (auth-ui).
3. User enters **email and password only** (no tenant); submits.
4. auth-api resolves tenant from user's primary org, issues tokens; redirect back to ordering callback.
5. Ordering-frontend exchanges code, stores tokens, calls `GET /api/v1/{tenant}/auth/me` (and sends `Authorization: Bearer <token>`, `X-Tenant-ID`).
6. Backend must return 200 (not 401).

## Test file

`ordering-frontend/e2e/ordering-authenticated-requests.spec.ts`

## Scenarios

### Full SSO login then SSO /me + 2 service endpoints return 200 and /auth/me has roles and permissions

The 401 test covers:

1. **SSO GET /api/v1/auth/me** – When observed in this flow (e.g. when ordering-backend fallback calls SSO /me), assert status 200 and response includes `roles` and `permissions`. If not observed (normal when ordering-backend `/auth/me` succeeds), SSO /me is covered by auth-ui E2E (see [sso-login-flow-e2e.md](../../auth-service/auth-ui/docs/e2eTests/sso-login-flow-e2e.md)).
2. **Ordering-backend GET /api/v1/{tenant}/auth/me** – Wait for response; assert status 200; assert response body includes `user` with `user.roles` (array) and `user.permissions` (array) so the user is synced locally and mapped with the right role and permissions.
3. **Second service endpoint: GET /api/v1/{tenant}/customers/orders/summary** – Wait for response (called by `hydrateOrders()` after successful profile); assert status 200 (no 401 on a second authenticated endpoint).

Steps:

- Start at ordering base URL with tenant (e.g. `/urban-loft`).
- Click "Sign in" → wait for accounts login page.
- Fill email and password (no tenant); submit.
- Wait for redirect back to ordering.
- Wait for ordering-backend `GET .../auth/me`; assert 200 and body has `user`, `user.roles`, `user.permissions`.
- Wait for ordering-backend `GET .../customers/orders/summary`; assert 200.
- If SSO `GET .../auth/me` was observed (e.g. fallback path), assert 200 and body has `roles` and `permissions`.

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Ordering-frontend origin | `https://ordersapp.codevertexitsolutions.com` |
| `E2E_ORG_SLUG` | Tenant slug | `urban-loft` |
| `E2E_LOGIN_EMAIL` | SSO login email | `demo@bengobox.dev` |
| `E2E_LOGIN_PASSWORD` | SSO login password | `DemoUser2024!` |

## Running

```bash
cd ordering-service/ordering-frontend
pnpm test:e2e -- ordering-authenticated-requests
```

## Test run results (March 2026)

- **Auth-ui E2E:** 21 passed (all browsers).
- **Ordering-frontend E2E:** 12 passed, 3 failed (same test in chromium, firefox, webkit).
  - **Failure:** `full SSO login then SSO /me + 2 service endpoints return 200...` — ordering-backend `GET /auth/me` returned **401** instead of 200.
  - **Root cause (addressed):** ordering-backend router was skipping auth middleware for any path containing `/auth/`, so `/auth/me` and `/auth/logout` did not go through the same JWT validation chain as other protected routes. Fix: do not skip auth for `/auth/`; only skip truly public routes (webhooks, config, cafes, menu). See ordering-backend `internal/http/router/router.go`.

After deploying the ordering-backend router fix, re-run the test; if 401 persists, check backend logs for "invalid token" vs "user not found" (JIT) and ensure `AUTH_ISSUER` / `AUTH_JWKS_URL` match auth-api and the demo user/tenant exist in ordering DB.

## 401 causes (reference)

If this test fails with 401 on `/auth/me`:

- **Frontend:** Token getter not attached or token not in store when request runs; `X-Tenant-ID` / `X-Tenant-Slug` not set in request headers; wrong base URL (tenant missing from path).
- **Backend:** Router must **not** skip auth middleware for `GET /auth/me` or `POST /auth/logout`. JWT validator (JWKS/issuer) must match auth-api; tenant from path/header must be present; user not in DB and JIT must succeed (tenant must exist in ordering DB).

See [SSO-AUTHENTICATED-REQUESTS-AND-401.md](../../../shared-docs/SSO-AUTHENTICATED-REQUESTS-AND-401.md) for the full contract and checklist.
