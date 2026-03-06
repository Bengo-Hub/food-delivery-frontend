# Food Delivery Frontend Delivery Plan

## Vision & Experience Principles

- Deliver a **customer-focused online ordering PWA** (Progressive Web Application) for delivery/shipping orders with mobile-first design, offline support, and real-time order tracking.
- **Service Boundaries**: This frontend handles **online ordering only**. Rider dashboards redirect to logistics-service, staff/admin dashboards redirect to cafe-website.
- Uphold brand palette and accessibility (WCAG 2.1 AA) while ensuring sub-second perceived performance on mobile devices.
- PWA features: Installable, offline menu browsing, push notifications, fast loading, responsive design.

## Recent Progress (March 2026 — RBAC & TanStack Query)

- **Roles/permissions from backend**: `useMe` hook (TanStack Query, 5-min TTL) fetches `GET /auth/me` from ordering-backend; result synced to auth store via `AuthSync`. Route protection and nav use roles/permissions from `useMe` with store fallback. Redirect to `/unauthorized` on access denial; 401 from me redirects to auth.
- **404/unauthorized**: Root and tenant-scoped `not-found.tsx`; `[orgSlug]/unauthorized/page.tsx` for access-denied.
- **TanStack Query**: All app data fetches use useQuery/useMutation via hooks (useMe, use-menu, use-orders, use-admin, use-brand, use-loyalty, use-notifications).

## Recent Progress (February 2026 — Week 2: Testing & Polish)

- **Test Infrastructure** (Feb 16): Installed MSW v2, created mock handlers (17 HTTP endpoints), server setup, and TestWrapper (QueryClient + OrgSlugProvider).
- **Store Tests** (Feb 16): 28 tests across 5 files — auth, cart, dining-mode (10 tests), location (5 tests), cart-persistence (3 tests). All passing.
- **Hook Tests** (Feb 16): 33 tests across 3 files — use-menu (11 tests), use-orders (14 tests), use-loyalty (8 tests). Covers queries, mutations, query key factories, cache invalidation.
- **Component Tests** (Feb 16): 6 checkout flow tests — unauthenticated guard, empty cart, order summary, delivery fee logic, pickup free delivery, payment method toggle.
- **Responsive Fixes** (Feb 16): Orders summary cards gap tightened on mobile (`gap-2 sm:gap-3`), order detail timeline labels truncation safety added.
- **Total**: 67 frontend tests across 10 files, all passing.

## Recent Progress (February 2026 — Week 1: MVP Features)

- **Order History Pages** (Feb 16): Built dedicated `/orders` list page with status tabs (All/Active/Completed/Cancelled), search, summary cards. Added `/orders/[orderId]` detail page with order timeline, items breakdown, delivery/payment info, reorder and cancel actions.
- **Loyalty Dashboard** (Feb 16): Created `/loyalty` page with tier progress visualization, points balance hero card, transaction history with pagination, tier benefits breakdown, and "How it works" onboarding section. API layer: `lib/api/loyalty.ts` + `hooks/use-loyalty.ts`.
- **Email Verification Flow** (Feb 16): Built `/auth/verify-email` OTP input page with 6-digit code entry, paste support, resend cooldown timer, and success redirect.
- **Notification Preferences** (Feb 16): Created API hooks (`hooks/use-notifications.ts`) for backend notification preferences endpoints. Profile page preferences card enhanced with backend API readiness.
- **Cart Persistence** (Feb 15): Added Zustand `persist` middleware to cart store — cart survives page refresh via localStorage.
- **Profile Enhancement** (Feb 16): Loyalty card in profile now links to dedicated `/loyalty` page.

## Recent Progress (December 2025)

- **Service Boundary Refactoring** (Dec 2025): Removed rider and staff dashboards from ordering frontend. These now redirect to logistics-service and cafe-website respectively. Ordering frontend is now focused solely on customer-facing online ordering.
- **PWA Implementation** (Dec 2025): Added Progressive Web App support with manifest.json, service worker, offline caching, and install prompts. Configured Workbox for caching strategies (cache-first for static assets, stale-while-revalidate for menu data, network-first for cart).
- **Mobile-First Redesign** (Dec 2025): Redesigned menu and layout components for mobile-first experience with responsive breakpoints, touch-friendly buttons (min 44x44px), scrollable horizontal filters, and optimized spacing for small screens.
- **Landing page revamp**: Complete redesign with modern, mobile-first responsive layout. Removed cafe-specific marketing content, keeping only ordering-focused features.
- **Component structure consolidation**: Removed `components/primitives/` duplication, standardized all components to use `@/components/ui/` following shadcn/ui best practices.
- Unified light/dark theming with CSS variables, shadcn components, and mobile-ready navigation/headers/footers.
- Delivered location-aware experiences: reusable Leaflet map component, geolocation hooks, and customer address selectors with autocomplete.
- Implemented role-based auth hub with customer sign-up and account management.
- Wired Sprint 0 identity UX to live backend OAuth/JWT endpoints, with centralized axios services, session refresh logic, and RBAC-aware dashboard guards.

## Upcoming Focus

- Integrate brand configuration, logo management, and copy overrides with backend admin APIs (`look_and_feel` settings).
- Persist customer/rider address books via backend location services, including reverse geocoding and Busia geofence validation on the server, keyed by shared `tenant_slug` and outlet identifiers.
- **Rider Onboarding Integration**:
  - **Tenant Service Check**: Before rider onboarding, verify tenant has logistics service enabled in subscription plan
  - **Option A - API Push**: If tenant has logistics service, call cafe-backend endpoint which pushes to logistics-service API (`POST /v1/{tenant}/fleet-members`)
  - **Option B - UI Redirect**: Redirect to logistics-service UI for self-onboarding (`https://logistics.codevertexitsolutions.com/{tenant_slug}/riders/onboard?return_url={cafe_url}`)
  - Frontend stores only `rider_id` reference returned from logistics-service
  - **All rider/fleet/driver logic is centralized in logistics-service—cafe-backend does not handle rider data**
  - **Standalone Logistics**: If tenant only uses logistics-service, rider onboarding happens directly in logistics-service UI
- Connect merchant/staff invite flows to tenancy provisioning once backend tenancy endpoints are live.
- Surface subscription/license management UI: plan comparison, usage metrics (orders/riders), upgrade/downgrade flows, renewal notices, and invoice history powered by the new subscription APIs.
- Build admin settings for integration credentials (POS gateway, treasury, notifications), API key rotation, and backup/restore requests once backend configuration endpoints are exposed; surface cross-service linkage (logistics riders, inventory stock, POS outlets) using a unified tenant/outlet selector and webhook-driven status updates.
- **Auth-Service Integration** (Production: `https://sso.codevertexitsolutions.com/`):
  - Update login/registration to call auth-service directly or proxy through backend
  - Add tenant selection UI (tenant_slug required for all auth requests)
  - Handle auth-service response format: `{access_token, refresh_token, session_id, tenant, user}`
  - Extract tenant_id from JWT claims for multi-tenant routing
  - Superuser detection and UI adjustments (bypass restrictions)
  - OAuth callbacks, OTP support, and session handling shared with mobile apps
- Surface real-time stock availability and substitution suggestions powered by `inventory-service` reservations.
- Extend delivery tracker to consume `logistics-service` task status streams for ETA accuracy across web and mobile tiers.
- Implement dashboard shells for merchants and riders once orders, payouts, and analytics APIs are available.
- Admin creation remains restricted: superuser provisions initial admin accounts; no public admin signup flows will be exposed.

## Client Applications & Feature Scope

**This Frontend (Ordering Service PWA)**:
1. **Customer Web/PWA (Primary Focus)** ✅
   - Menu browsing with category filters, dietary tags, search, and personalized recommendations.
   - Shopping cart management with item modifiers, variants, and real-time availability.
   - Checkout with multiple delivery options (ASAP, scheduled), address management, and payment method selection.
   - Real-time order tracking (map view, status timeline) with WebSocket integration to logistics-service.
   - Push notifications for order status updates, promotions, and loyalty points.
   - Customer account management (profile, addresses, payment methods, order history, loyalty).
   - Offline support: Browse cached menu items, view cart, queue actions for when online.
   - PWA install prompts and "Add to Home Screen" functionality.
   - _Backend alignment: [Sprint 3 – Orders & Cart](../ordering-backend/plan.md#sprint-3--orders--cart-weeks-6-7) & [Sprint 4 – Payments Core](../ordering-backend/plan.md#sprint-4--payments-core-weeks-8-9)._

**Other Services (Not Part of This Frontend)**:
2. **Rider Mobile App** → **logistics-service** (Separate app)
   - **IMPORTANT**: All rider functionality is powered by `logistics-service` APIs directly. This ordering frontend redirects rider users to logistics-service UI.
   - **Rider Authentication**: Riders authenticate via auth-service (SSO) - same credentials work across all services
   - **Rider Data**: All rider data (profile, documents, KYC, vehicle, shifts, earnings) stored in logistics-service
   - **Standalone Mode**: If tenant only uses logistics-service, rider app works independently without cafe service
   - Shift sign-in: `POST /v1/{tenant}/fleet-members/{id}/shifts` (logistics-service)
   - Order queue: `GET /v1/{tenant}/tasks?fleet_member_id={id}&status=assigned` (logistics-service)
   - Task accept/decline: `POST /v1/{tenant}/tasks/{id}/accept` or `/decline` (logistics-service)
   - Turn-by-turn navigation: Use Mapbox/Google SDK with route data from logistics-service
   - Proof of delivery: `POST /v1/{tenant}/tasks/{id}/complete` with PoD artifacts (logistics-service)
   - Earnings dashboard: Query `GET /v1/{tenant}/fleet-members/{id}/earnings` (logistics-service) or consume treasury-api payout events
   - Daily summary, issue reporting: All via logistics-service APIs
   - _Backend alignment: [Sprint 5 – Order Fulfilment & Logistics Integration](../cafe-backend/plan.md#sprint-5--order-fulfilment--logistics-integration-weeks-10-11) & logistics-service sprint files._
3. **Staff/Admin Dashboards** → **cafe-website** (Separate app)
   - Order queue management, operations analytics, and admin console belong to cafe-website.
   - This ordering frontend redirects staff/admin users to cafe-website admin dashboard.
   - _See: [Cafe Website Plan](../../Cafe/cafe-website/docs/plan.md)_

4. **POS Operations** → **pos-service** (Separate service)
   - POS terminals, cash drawer management, dine-in orders, pickup orders belong to pos-service.
   - This ordering frontend only handles online delivery/shipping orders.
   - _See: [POS Service Plan](../../pos-service/pos-api/plan.md)_

## Experience Structure

- **Ordering Platform (This Frontend):**
  - Landing page with ordering platform value proposition and customer CTAs.
  - `Menu` page for browsing and selecting items for delivery.
  - Customer dashboard for order history, tracking, loyalty, and account management.
  - Profile management for addresses, payment methods, and preferences.
  - **Note**: Marketing pages (About, Contact, Cafés) belong to cafe-website, not this ordering frontend.
- **Ordering Journey (Customers):**
  - Browse → menu detail → cart → checkout (support prepay or COD) → order confirmation.
  - Real-time order tracking view with status timeline and map.
  - Profile area for address management (default & custom pins), saved payment methods, loyalty, and receipts.
  - _Backend references: [Sprint 3 – Orders & Cart](../cafe-backend/plan.md#sprint-3--orders--cart-weeks-6-7), [Sprint 4 – Payments Core](../cafe-backend/plan.md#sprint-4--payments-core-weeks-8-9)._
- **Driver App Group:**
  - Shift management (clock-in/out), order queue, navigation hand-off, proof of delivery capture.
  - Earnings dashboard with payouts sourced from `treasury-api`, payout history, and tax document downloads.
  - _Backend references: [Sprint 5 – Fulfilment & Dispatch](../cafe-backend/plan.md#sprint-5--fulfilment--dispatch-weeks-10-11) & treasury integrations in [Payments & Treasury Integration](../cafe-backend/plan.md#payments--treasury-integration-priority-3)._
- **Admin/Staff Portal:**
  - Multi-tenant dashboard to manage orders, inventory, riders, staff schedules, and promotions.
  - SLA monitoring, escalation workflows, manual adjustments synced with treasury settlements, and license usage indicators (limits for riders/orders) with upgrade CTAs.
  - Notification rule builder hooked into `notifications-api` for templated campaigns and alerts.
  - POS integration workspace for mapping POS outlets to cafes, monitoring sync status, and triggering manual imports via `pos-service` APIs backed by the shared outlet registry (no duplicate outlet tables in frontend or backend).
  - _Backend references: [Sprint 6 – Notifications & Ops](../cafe-backend/plan.md#sprint-6--notifications--ops-weeks-12-13) & [Sprint 7 – Analytics, Compliance & Hardening](../cafe-backend/plan.md#sprint-7--analytics-compliance--hardening-weeks-14-15)._

> Refer to [`docs/information-architecture-checklist.md`](docs/information-architecture-checklist.md) when auditing wireframes to ensure each experience group is covered.

## Tooling & Architecture

- **Frameworks:** Next.js 15 (App Router), React Native 0.74+, Expo for rapid builds, Capacitor PWA enhancements.
- **State & Data:** TanStack Query for server state, Zustand for lightweight client state, React Hook Form + Zod validation, Jotai for low-level atoms where needed.
- **Networking:** Axios via shared `baseapi` wrapper, WebSocket/SSE client for live updates, service worker API for offline sync.
- **UI System:** Tailwind CSS + Radix UI (web), NativeWind (mobile), Figma handoff tokens synced through Style Dictionary.
- **Maps & Geo:** Leaflet (web) with reusable map component and geofence logic; Mapbox/React Native Mapbox GL on mobile; fallback to Google Maps if required.
- **Internationalization:** next-intl (web) & react-native-localize + i18next (mobile), centralized copy JSON with translation pipeline.
- **Testing & Quality:** Vitest + Testing Library, Detox/E2E for mobile, Playwright for PWA, Percy visual testing.
- **Analytics:** Segment/Amplitude instrumentation, consent-aware tracking toggles.
  - Theming tokens now hydrate from CSS variables; upcoming backend sync will persist look & feel per tenant.
  - _Backend alignment: Observability & analytics hooks tie into [Cross-Cutting Concerns – Observability](../cafe-backend/plan.md#cross-cutting-concerns)._

## Cross-Cutting Concerns

- **Offline & Performance:** service worker caching strategies (App Shell, stale-while-revalidate), background sync for failed actions, skeleton loading states, Lighthouse score targets (Performance 90+, PWA badge).
- **Accessibility:** Semantic components, keyboard navigation, color contrast validation (axe), accessible map alternatives.
- **Security & Privacy:** Secure storage (expo-secure-store), CSRF protection, input sanitization, session renewal flows, telemetry anonymization, and enforcing that all API calls include tenant + outlet context consistent with backend microservices. Webhook signatures are verified client-side (where applicable) before mutating state.
- **Identity Federation:** Consume `auth-service` OIDC sessions (Production: `https://sso.codevertexitsolutions.com/`)
  - PKCE + refresh token lifecycles with silent renewals
  - MFA prompts mirrored in mobile/web
  - Tenant selection required for all auth flows
  - Superuser detection from JWT claims
  - Service-to-service authentication for backend calls
- **Auth API Contract:** All authentication flows now depend on live backend endpoints; legacy mock sign-in helpers have been removed to prevent divergence between environments.
- **Dev Experience:** Monorepo with Turborepo, Storybook for design review, linting (ESLint, Stylelint), Prettier config, Husky pre-commit hooks.
- **Responsive & PWA-Ready:** Every page, including admin and driver flows, must be responsive (mobile, tablet, desktop) with installable PWA support so users can run the experience without separate native builds.

## Integration Points

- **Backend APIs:** Strict contract via OpenAPI, shared TypeScript types (tRPC or openapi-typescript) to avoid drift, with webhook callbacks driving state updates rather than polling. **Note: Rider/fleet/driver APIs are consumed directly from `logistics-service`, not from cafe-backend.**
- **Cross-Service Data Ownership:** See [Cross-Service Data Ownership](../cafe-backend/docs/CROSS-SERVICE-DATA-OWNERSHIP.md) for patterns on service-specific data management, tenant service availability checks, and user management across services.
- **`notifications-api`:** Subscription management UI, template preview, user channel preferences, and consumption of notification delivery receipts for in-app status chips, all scoped by the shared tenant/outlet keys and delivered via signed webhooks.
- **`treasury-api`:** Payment status webhooks, rider/cafe wallet balances, payout visibility, and surface of treasury settlement timelines inside the operations dashboards (no polling).
- **`auth-service`** (Production: `https://sso.codevertexitsolutions.com/`):
  - **SSO Flows**: All login/registration via auth-service endpoints
  - **Session Refresh**: Token refresh proxied to auth-service
  - **Device Management UI**: Device management handled by auth-service
  - **Tenant/Role Claims**: Extract tenant_id and roles from JWT claims for client-side guards
  - **Tenant Selection**: UI for tenant_slug selection (required for all auth requests)
  - **Superuser Handling**: Detect superuser from JWT claims, bypass UI restrictions
  - **Tenant Discovery**: Webhooks ensure downstream services have current metadata after login
- **`inventory-service`:** Stock availability indicators, substitution recommendations, low-stock alerts for cafe dashboards, recipe depletion insights, referencing canonical inventory IDs (no local duplicates) delivered through subscription webhooks.
- **`logistics-service`:** **CRITICAL - Entity Ownership**: All rider, driver, fleet, delivery task, shift, telemetry, and proof-of-delivery data is owned by `logistics-service`. Frontend consumes logistics-service APIs directly for:
  - Live driver location feed (WebSocket/SSE streams)
  - ETA updates and reroute notifications
  - Proof-of-delivery evidence viewing
  - Rider onboarding status and verification
  - Task creation, assignment, and status updates
  - Fleet member queries and availability checks
- **`pos-service`:** Outlet mapping, POS ticket reconciliation, and settlement summaries surfaced within admin dashboards based on settlement webhooks (no polling).
- **Push Providers:** Firebase Cloud Messaging for Android/web, Apple Push Notifications, plus SMS fallback toggles.
  - _Backend alignment: See [External Integrations & Dependencies](../cafe-backend/plan.md#external-integrations--dependencies) in the backend plan._

## Known Gaps

- Forms currently simulate submissions; backend endpoints for KYC, tenant provisioning, and OAuth callbacks are required.
- Staff portal authentication awaits invitation token verification API and session management.
- Rider and merchant dashboards will ship after orders, payouts, and analytics APIs are available.

## Delivery Roadmap (Priority-Ordered Sprints)

1. **Sprint 0 – Foundations & Design System (Week 1)** — _Status: ✅ Completed (Nov 2025)_
   - Setup repo, Next.js shell, shadcn UI, Storybook, lint/test pipelines. ✔
   - Define routing architecture, internationalization scaffolding, theming tokens. ✔
   - Implement identity bootstrap: RBAC role/permission model, auth store scaffolding, Google OAuth wiring from frontend to backend contracts. ✔
   - Deliverables shipped: base layout, theming tokens, auth state container, component primitives reused across marketing pages.
   - Next: none (move focus to Sprint 1).
   - _Backend link: [Sprint 0 – Foundation](../cafe-backend/plan.md#sprint-0--foundation-week-1)._

2. **Sprint 1 – Customer Web MVP (Weeks 2-3)** — _Status: 🚧 In Progress (90% Complete)_
   - **Completed**:
     - Marketing pages (landing, about, contact, delivery, menu preview, loyalty, cafés)
     - Location components (picker, map, geofence validation, address autocomplete)
     - Customer signup page with OAuth integration
     - Auth integration with backend (login, OAuth, session management)
     - Responsive design across all pages
     - Base API client setup with axios
     - **January 2026**: TanStack Query hooks for menu/catalog API (`src/hooks/use-menu.ts`)
     - **January 2026**: Menu types and API client (`src/types/menu.ts`, `src/lib/api/menu.ts`)
     - **January 2026**: Product detail page (`/menu/[id]`) with customizations, dietary info, add to cart
     - **January 2026**: Outlet detail page (`/outlet/[id]`) with menu, search, categories
     - **January 2026**: Uber Eats-style cart drawer with quantity controls, order summary
     - **January 2026**: Uber Eats-style location dialog with address management
     - **January 2026**: Uber Eats-style user menu drawer (side panel)
   - **Outstanding**:
     - ~~Cart persistence to localStorage~~ ✅ Done (Feb 15)
     - Related items on product detail page
     - ~~Email verification flow~~ ✅ Done (Feb 16)
     - ~~Unit tests~~ ✅ Done (Feb 16) — 67 tests across 10 files
   - **Next sprint tasks**: Wire location store into checkout, integrate with live backend APIs.
   - _Backend link: [Sprint 1 – Identity & Access](../cafe-backend/plan.md#sprint-1--identity--access-management-weeks-2-3) & [Sprint 2 – Catalog & Localization](../cafe-backend/plan.md#sprint-2--catalog--localization-weeks-4-5)._
3. **Sprint 2 – Checkout & Payments UX (Weeks 4-5)** — _Status: ⏳ Not Started_
   - Planned: Checkout form, address management, promo/loyalty handling, payment orchestration UI (treasury integration), order confirmation.
   - Dependencies: baseapi client, treasury APIs, persisted address book from Sprint 1 location store.
   - Next up once Sprint 1 closes: design checkout pages, integrate saved/default addresses from `useCustomerLocationStore`, begin payment method components.
   - _Backend link: [Sprint 4 – Payments Core](../cafe-backend/plan.md#sprint-4--payments-core-weeks-8-9)._
4. **Sprint 3 – Real-Time Tracking & Notifications (Weeks 6-7)** — _Status: ⏳ Not Started (early groundwork laid)_
   - Groundwork shipped in Sprint 1: reusable map component and delivery timeline (`src/app/delivery/page.tsx`) ready to consume WebSocket updates.
   - Upcoming: Live order status timeline, WebSocket integration, notification preferences, service worker push support.
   - _Backend link: [Sprint 5 – Fulfilment & Dispatch](../cafe-backend/plan.md#sprint-5--fulfilment--dispatch-weeks-10-11) & [Sprint 6 – Notifications & Ops](../cafe-backend/plan.md#sprint-6--notifications--ops-weeks-12-13)._
5. **Sprint 4 – Cafe Dashboard (Weeks 8-9)** — _Status: ⏳ Not Started_
   - Cross-sprint dependency: location picker + geofence from Sprint 1 also powers future cart/checkout (Sprint 2) and tracking (Sprint 3).

## Backlog & Enhancements

- AI-driven recommendations & upsell banners, live chat support widget, referral programs, queue-based loyalty rewards, white-label theming for multi-brand expansion.
- Advanced rider route optimization, shift bidding, tip management, micro-interactions for user delight.

---

**Next Steps:** Align with backend on contract-first API specs, finalize component library scope, and lock UX milestones with stakeholders.

## Runtime Ports & Environments

- **Local development:** consume backend at `http://localhost:4000`, treasury at `http://localhost:4001`, and notifications at `http://localhost:4002` when running services locally.
- **Cloud deployment:** all backend ingress endpoints terminate on port **4000**, so the frontend uses public DNS (e.g. `https://cafeapi.codevertexitsolutions.com`) without port suffixes.
