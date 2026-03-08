# Sprint 6 – MVP Launch (March 17, 2026)

**Duration**: March 6 – March 17, 2026 (10 working days)  
**Status**: 🔴 In Progress  
**Goal**: Ship a working customer ordering PWA for the Busia outlet at `ordersapp.codevertexitsolutions.com`.

**Progress (March 2026)**: Verified auth (Zustand + localStorage persistence, 401 interceptor clears session); menu uses tenant-scoped `GET .../menu/items` and `.../menu/categories` via `use-menu.ts` and `menu.ts`; order creation now sends `idempotencyKey`; checkout shows failed-order error state and keeps form for retry. Cart remains local (Zustand + localStorage); server-side cart and POST /carts not implemented. **Tenant/brand**: useBrandConfig fetches GET /api/v1/{tenant}/config (ordering-backend) with orgSlug + NEXT_PUBLIC_TENANT_SLUG fallback; BrandThemeSync applies primary/secondary colors to CSS vars; site-header shows org name/logo from config with static brand fallback; staff settings page includes App brand summary (read-only). Alternative: auth-api GET /api/v1/tenants/by-slug/{slug} for tenant display if needed.

**RBAC & data fetching**: Roles and permissions are loaded from ordering-backend `GET /auth/me` (not auth-api; ordering-backend proxies/syncs user from auth-service via NATS). `useMe` hook (TanStack Query) fetches `/auth/me` with 5-min TTL (`staleTime`); result is synced into auth store via `AuthSync` in `AppProviders`. Nav visibility and route protection use `useMe().data?.user` (roles + permissions) with store fallback; `RequireAuth` uses `useMe` for permission checks and redirects to `/unauthorized` when access is denied; 401 from `useMe` redirects to auth. **404/unauthorized**: Root `app/not-found.tsx` and tenant-scoped `app/[orgSlug]/not-found.tsx`; `app/[orgSlug]/unauthorized/page.tsx` for access-denied. **TanStack Query**: All data fetches use TanStack Query (useQuery/useMutation) via hooks: `useMe` (auth/me), `use-menu`, `use-orders`, `use-admin`, `use-brand`, `use-loyalty`, `use-notifications`, `use-base-query`. No raw fetch/axios in components for app API; external calls (SSO token exchange, Nominatim geocoding) remain fetch where appropriate.

---

## Hard Constraints

- **Tenant**: `urban-loft` only
- **Outlet**: Busia only (Kiambu mock data must not appear)
- **Platform**: Mobile-first PWA, must work on Chrome Android and Safari iOS
- **Backend**: `orderingapi.codevertexitsolutions.com` (Go, see backend Sprint 9)

---

## Critical Path Tasks

### CP-1: E2E Customer Flow Wiring

**Priority**: P0 — the entire MVP  
**Owner**: Frontend

Wire every step of the customer journey to real API calls:

**Auth**
- [ ] Login page calls `POST /v1/urban-loft/auth/login` via `baseapi` (app uses SSO/OAuth instead)
- [ ] Registration page calls `POST /v1/urban-loft/auth/register` (app uses SSO signup)
- [x] Token stored in Zustand auth store, refresh interceptor works (persisted in localStorage; 401 response interceptor clears session)
- [x] Google OAuth redirect and callback handler functional (SSO/BengoBox OIDC redirect + callback in auth/callback)
- [x] Role-based redirect after auth (customer stays, staff/rider redirected)

**Menu**
- [x] `/urban-loft/menu` fetches categories from `GET /v1/urban-loft/menu-categories` (via `GET {tenant}/menu/categories` in menu.ts)
- [x] Menu items fetched from `GET /v1/urban-loft/menu-items?cafe_id={busia_id}` (via `GET {tenant}/menu/items?cafe_id=...` in menu.ts)
- [x] Item detail page fetches variants from `GET /v1/urban-loft/menu-items/{id}` (via useMenuItem → menu/items/{id})
- [ ] Skeleton loaders show during data fetch (item detail has loading text; menu grid could add skeletons)
- [x] Empty state shown if no items (should not happen with proper seed) (MenuDiscovery shows empty state when no items match filters)
- [ ] Unavailable items greyed out with badge

**Cart**
- [ ] "Add to Cart" creates server-side cart via `POST /v1/urban-loft/carts`
- [ ] Cart items synced between Zustand store and server
- [ ] Quantity update calls `PATCH /v1/urban-loft/carts/{id}/items/{iid}`
- [ ] Remove item calls `DELETE /v1/urban-loft/carts/{id}/items/{iid}`
- [x] Cart badge in bottom nav shows live item count
- [x] Cart persists in IndexedDB for offline/refresh resilience (persists in localStorage via Zustand persist; IndexedDB not used)

**Checkout**
- [x] Checkout page shows cart summary with delivery fee and totals from server (totals computed client-side from cart; server returns order)
- [x] Delivery address selection works (saved addresses or new address input) (dining mode + delivery location from store)
- [x] Payment method selection: M-Pesa as primary default
- [x] Order submission: `POST /v1/urban-loft/orders` with `idempotency_key` (idempotencyKey sent from checkout)
- [x] Submit button disables on click, shows loading state
- [x] On success: redirect to tracking page

**Payment**
- [ ] M-Pesa: show "Check your phone for M-Pesa prompt" screen
- [ ] Poll order status every 3 seconds for payment confirmation
- [ ] On payment confirmed: show success animation, transition to tracking
- [ ] On payment failed: show error with "Retry" option
- [ ] On timeout (2 min): show "Payment taking longer than expected" with options

**Tracking**
- [ ] `/urban-loft/track/{orderId}` shows order status timeline
- [ ] Auto-poll order status every 10 seconds
- [ ] Display ETA when out_for_delivery
- [ ] Show rider name/phone when assigned
- [ ] Map placeholder (static map with delivery pin for MVP; live tracking post-MVP)

### CP-2: Busia-Only Outlet Enforcement

**Priority**: P0 — no mock data in production  
**Owner**: Frontend

- [ ] Remove any hardcoded Kiambu outlet references from components
- [ ] Outlet header selector: auto-select Busia when only one outlet returned
- [ ] If `GET /v1/urban-loft/outlets` returns empty, show error state (not blank page)
- [ ] Verify no mock/placeholder data renders in production build
- [ ] Menu images point to real CDN URLs (not placeholder images)

### CP-3: PWA Install Prompt (Aggressive)

**Priority**: P0 — maximize mobile installs on launch day  
**Owner**: Frontend

- [ ] Bottom banner appears after 10 seconds on first mobile visit
- [ ] Banner appears again when user adds first cart item
- [ ] Banner appears on order confirmation page
- [ ] "Install" button triggers native `beforeinstallprompt`
- [ ] "Not now" dismisses with 3-day cooldown (stored in localStorage)
- [ ] iOS users see custom modal with Add-to-Home-Screen instructions
- [ ] Track install events: `pwa_install_prompt_shown`, `pwa_installed`, `pwa_dismissed`

---

## High Priority Tasks

### HP-1: Staff Dashboard Wiring

**Priority**: P1 — best effort for launch  
**Owner**: Frontend

- [ ] `/urban-loft/dashboard/staff` fetches orders from `GET /v1/urban-loft/admin/orders`
- [ ] Status filter tabs: Pending, Preparing, Ready, Completed
- [ ] Order detail expand shows items, customer info, delivery address
- [ ] Status action buttons call `PATCH /v1/urban-loft/admin/orders/{id}/status`
- [ ] Basic metrics cards at top (orders today, revenue) from `GET /v1/urban-loft/admin/analytics/summary`
- [ ] Auto-refresh every 15 seconds
- [ ] Access gated by role check (redirect non-staff users to menu)

### HP-2: Menu Management Page

**Priority**: P1  
**Owner**: Frontend

- [ ] `/urban-loft/dashboard/staff/menu` lists menu items in table format
- [ ] Toggle item availability (calls backend PATCH)
- [ ] Edit price inline (calls backend PATCH)
- [ ] Add new item form (calls backend POST)
- [ ] Image upload for menu items

### HP-3: Responsive Polish

**Priority**: P1  
**Owner**: Frontend

- [ ] Test all pages at 375px (iPhone SE), 390px (iPhone 14), 412px (Pixel)
- [ ] Bottom nav doesn't overlap page content (proper padding-bottom)
- [ ] Checkout form inputs don't trigger zoom on iOS (font-size >= 16px)
- [ ] Cart items scrollable without page scroll
- [ ] Modals/sheets don't break on small screens
- [ ] Long menu item names truncate with ellipsis

### HP-4: Error States & Empty States

**Priority**: P1  
**Owner**: Frontend

- [ ] Network error: toast + "Retry" button on all data-fetching pages
- [x] 401 during browsing: redirect to auth page with return URL (API response interceptor clears session / logout)
- [x] Empty orders list: "No orders yet. Browse our menu!" with CTA (orders page shows "No orders found" + Browse Menu link)
- [x] Failed order submission: show error message, keep form data, enable retry
- [ ] Service unavailable (503): full-page banner with retry countdown

---

## Medium Priority Tasks

### MP-1: Offline Support Verification

**Priority**: P2

- [ ] Service worker caches menu data (Stale-While-Revalidate)
- [ ] Offline banner appears when connection lost
- [ ] Cached menu items browsable offline
- [ ] Cart visible offline (IndexedDB)
- [ ] Order placement blocked with clear message when offline
- [ ] Banner auto-dismisses when connection restored

### MP-2: Push Notification Setup

**Priority**: P2

- [ ] Permission prompt after first successful order
- [ ] Subscription sent to backend `POST /v1/{tenant}/push/subscribe`
- [ ] Service worker handles incoming push events
- [ ] Notification click navigates to relevant page (order tracking)
- [ ] Notification permission denied gracefully (no repeated prompts)

### MP-3: Performance Audit

**Priority**: P2

- [ ] Lighthouse mobile score > 80 for Performance
- [ ] FCP < 1.8s on simulated 3G
- [ ] No layout shifts on menu page (CLS < 0.1)
- [ ] Images optimized: WebP, lazy loaded, max 100KB each
- [ ] Initial JS bundle < 150KB gzipped
- [ ] Remove any unused dependencies from bundle

### MP-4: Customer Dashboard

**Priority**: P2

- [ ] `/urban-loft/dashboard/customer` shows order history
- [ ] Order list with status badges, date, total
- [ ] Click order to see detail
- [ ] "Reorder" button creates new cart from previous order items
- [ ] Loyalty points balance displayed

---

## Out of Scope (Post-MVP)

- Group ordering UI
- Loyalty tier progression display
- Live rider tracking with map animation (polling only for MVP)
- Multi-language toggle (EN only for MVP, Swahili post-launch)
- Advanced promo code management UI
- Analytics/Superset embed
- Dark mode toggle (system preference respected, no manual toggle)
- Customer reviews/ratings

---

## Testing Checklist

### Manual E2E Test (must pass before launch)

Run through on a real Android phone on mobile data:

1. [ ] Open `ordersapp.codevertexitsolutions.com` — menu loads within 3 seconds
2. [ ] PWA install banner appears — tap "Install" — app added to home screen
3. [ ] Open app from home screen — displays in standalone mode (no browser chrome)
4. [ ] Tap "Login" — enter phone/email + password — authenticated successfully
5. [ ] Browse menu — see Busia outlet items with images and prices
6. [ ] Tap item — see detail with variants — select variant — tap "Add to Cart"
7. [ ] Cart badge updates — tap cart — see items with correct totals
8. [ ] Tap "Checkout" — select delivery address — select M-Pesa — tap "Place Order"
9. [ ] See "Check your phone" screen — receive M-Pesa prompt — confirm payment
10. [ ] Payment confirmed — see order confirmation — redirected to tracking page
11. [ ] Order status shows "Confirmed" — refreshes automatically
12. [ ] Kill network — app shows offline banner — cached menu still viewable
13. [ ] Restore network — offline banner dismisses — order tracking resumes

### Cross-Browser

- [ ] Chrome Android (primary)
- [ ] Safari iOS 16.4+ (PWA install, push notifications)
- [ ] Chrome Desktop (responsive layout)
- [ ] Firefox Android (basic functionality)

---

## Deployment Checklist

### Pre-Launch (March 14-16)

- [ ] All environment variables set in K8s deployment
- [ ] `NEXT_PUBLIC_API_BASE_URL` points to production backend
- [ ] `NEXT_PUBLIC_VAPID_KEY` set for push notifications
- [ ] PWA icons generated and in `/public/icons/`
- [ ] `manifest.json` has correct `start_url` and theme colors
- [ ] `robots.txt` allows indexing
- [ ] OpenGraph meta tags set for social sharing
- [ ] `pnpm run build` passes with 0 errors
- [ ] Verify no `localhost` or mock URLs in production env

### Launch Day (March 17)

- [ ] Deploy via ArgoCD
- [ ] Verify `/healthz` returns 200
- [ ] Run manual E2E test on real phone
- [ ] Verify PWA install prompt fires on mobile
- [ ] Place one real test order end-to-end
- [ ] Monitor Web Vitals for first hour
- [ ] Keep previous deployment image ready for rollback

### Post-Launch (March 18-21)

- [ ] Monitor Lighthouse scores daily
- [ ] Track PWA install rate
- [ ] Collect user feedback on mobile UX
- [ ] Fix any reported layout/display issues as hotfixes
- [ ] Monitor cart abandonment rate (if analytics wired)

---

## Coordination with Backend Sprint 9

| Frontend Needs | Backend Provides | Status |
|---------------|-----------------|--------|
| Menu data for Busia | Seeded menu items + `GET /v1/{tenant}/menu-items` | Pending verification |
| Single outlet auto-select | `GET /v1/{tenant}/outlets` returns only Busia | Pending |
| Cart + order creation | `POST /v1/{tenant}/carts`, `POST /v1/{tenant}/orders` | Implemented |
| M-Pesa payment flow | Treasury integration + webhook handling | Implemented |
| Order status polling | `GET /v1/{tenant}/orders/{id}` with status updates | Implemented |
| Admin order list | `GET /v1/{tenant}/admin/orders` | Pending verification |
| Brand config | `GET /v1/{tenant}/config` | Done (ordering-backend; auth-api `/tenants/by-slug/{slug}` alternative) |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend endpoints return empty data | Blank pages, broken flows | Skeleton loaders + empty states for every page |
| M-Pesa STK push not received | Customer stuck on payment screen | Timeout after 2 min with retry/cancel options |
| PWA install prompt not triggering | Low install rate | Fallback custom banner with manual instructions |
| Slow load on 3G | Users bounce | Aggressive caching, optimized images, code splitting |
| iOS Safari bugs | Broken layout for ~15% of users | Test on real iOS device, fix layout issues |

---

## Success Criteria

- [ ] Customer can complete an order from landing to payment confirmation on mobile
- [ ] PWA installs successfully on Android Chrome and iOS Safari
- [ ] Pages load in < 3 seconds on 3G connection
- [ ] No mock/placeholder data visible in production
- [ ] Staff can view and manage orders in dashboard
- [ ] Zero JavaScript errors blocking the ordering flow
