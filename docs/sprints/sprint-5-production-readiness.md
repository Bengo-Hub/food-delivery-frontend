# Sprint 5: Ordering Frontend Production Readiness

**Sprint**: 5
**Dates**: February 15, 2026
**Goal**: Replace mocks with real API calls, add brand config, create test scaffolding

---

## Completed

### Outlet List API Integration
- Removed hardcoded mock outlets from `site-header.tsx`
- Replaced with `useOutlets()` hook from `use-menu.ts`
- Hook calls real `GET /api/v1/{tenant}/outlets` endpoint
- Gracefully handles empty responses

### Brand Config Hook
- Created `src/hooks/use-brand.ts` with TanStack Query
- Fetches tenant configuration from `GET /api/v1/{tenant}/config`
- Falls back to static `config/brand.ts` values when backend unavailable
- 30-minute stale time (brand config rarely changes)
- No retry on failure — static fallback is sufficient

### Test Scaffolding
- Cart store tests (`__tests__/store/cart.test.ts`): 7 tests
  - Empty cart, add item, increment quantity, remove, update quantity, clear, subtotal
- Auth store tests (`__tests__/store/auth.test.ts`): 3 tests
  - Idle state, logout clears state, initialize with no session

### Build Status
- `pnpm run build` — 0 errors, 16 routes
- PWA manifest present
- K8s deployment configured at `devops-k8s/apps/ordering-frontend/`

---

## Frontend Routes (16)

| Route | Description |
|:---|:---|
| `/` | Root redirect |
| `/[orgSlug]/menu` | Browse menu categories and items |
| `/[orgSlug]/menu/[id]` | Menu item detail with variants |
| `/[orgSlug]/outlet/[id]` | Outlet detail with menu |
| `/[orgSlug]/checkout` | Cart review and payment |
| `/[orgSlug]/track/[orderId]` | Live order tracking |
| `/[orgSlug]/auth` | Login/signup |
| `/[orgSlug]/auth/callback` | OAuth callback |
| `/[orgSlug]/customers/signup` | Customer registration |
| `/[orgSlug]/profile` | User profile |
| `/[orgSlug]/dashboard/customer` | Customer order history |
| `/[orgSlug]/dashboard/staff` | Staff order management |
| `/[orgSlug]/dashboard/staff/menu` | Staff menu management |
| `/[orgSlug]/admin/request` | Admin access request |
| `/healthz` | Health check |

---

## Remaining Work (Post-Sprint)

- [ ] Backend `GET /outlets` endpoint (currently returns empty)
- [ ] Backend `GET /config` endpoint for tenant branding
- [ ] E2E test for full order flow
- [ ] Analytics embed (Superset — post-MVP)
- [ ] Group ordering feature (post-MVP)
