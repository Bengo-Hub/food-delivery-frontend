# Food Delivery Frontend Delivery Plan

## Vision & Experience Principles
- Deliver a unified Urban Cafe experience across web (Next.js), PWA, and mobile clients (React Native) with localized (EN/SW) content, offline resilience, and real-time delivery visibility.
- Uphold brand palette (chocolate brown, orange, white) and accessibility (WCAG 2.1 AA) while ensuring sub-second perceived performance.
- Leverage shared design tokens and component libraries to keep feature parity between customer, rider, cafe, and admin touchpoints.

## Recent Progress (November 2025)
- Implemented configurable brand theming with CSS variables and default assets (logo fallback) ready for backend-managed look & feel updates.
- Delivered public marketing surface: landing page CTAs for riders and SaaS merchants, plus dedicated overview pages for riders, merchants, delivery, cafés, loyalty, and services.
- Added rider onboarding and merchant signup flows with KYC capture, Google OAuth entry points, and staff portal scaffolding.
- Updated navigation, footer, and contact touchpoints to surface the new signup journeys and staff portal access.

## Upcoming Focus
- Integrate brand configuration, logo management, and copy overrides with backend admin APIs (`look_and_feel` settings).
- Wire rider onboarding form to backend KYC workflow service, implementing document upload storage and verification status APIs.
- Connect merchant signup flow to tenancy provisioning pipeline and automate staff invitation emails.
- Expand auth flows with actual OAuth callbacks, OTP support, and session handling shared with mobile apps.
- Implement dashboard shells for merchants and riders once backend endpoints for orders, payouts, and alerts are available.
- Admin creation is restricted: superuser (developer) provisions initial admin accounts; no public admin signup flows will be exposed.

## Client Applications & Feature Scope
1. **Customer Web/PWA (Priority 1)**
   - Menu browsing with category filters, dietary tags, search, and personalized recommendations.
   - Cart, promo codes, loyalty balance display, multi-address checkout with payment orchestration (via treasury APIs).
   - Real-time order tracker (map view, status timeline), push/SMS opt-in, order history & reordering.
   - Account management, language toggle, support ticket initiation.
   - _Backend alignment: [Sprint 3 – Orders & Cart](../food-delivery-backend/plan.md#sprint-3--orders--cart-weeks-6-7) & [Sprint 4 – Payments Core](../food-delivery-backend/plan.md#sprint-4--payments-core-weeks-8-9)._
2. **Customer Mobile App (React Native) (Priority 2)**
   - Mirrors web functionality with mobile-native navigation (React Navigation), biometric login, deep linking from SMS/Push.
   - Offline cart retention, network status awareness, background geolocation permissions management.
   - _Backend alignment: [Sprint 5 – Fulfilment & Dispatch](../food-delivery-backend/plan.md#sprint-5--fulfilment--dispatch-weeks-10-11)._
3. **Rider Mobile App (Priority 3)**
   - Shift sign-in, order queue with accept/decline, turn-by-turn navigation via Mapbox/Google SDK, proof of delivery (photo, code).
   - Earnings dashboard, daily summary, issue reporting.
   - _Backend alignment: [Sprint 5 – Fulfilment & Dispatch](../food-delivery-backend/plan.md#sprint-5--fulfilment--dispatch-weeks-10-11) & [Sprint 4 – Payments Core](../food-delivery-backend/plan.md#sprint-4--payments-core-weeks-8-9)._
4. **Cafe Dashboard (Priority 3)**
   - Order queue management, kitchen display mode, stock-out actions, driver assignment overrides.
   - Menu CRUD, price scheduling, promotion builder, operations analytics snapshots.
   - _Backend alignment: [Sprint 2 – Catalog & Localization](../food-delivery-backend/plan.md#sprint-2--catalog--localization-weeks-4-5) & [Sprint 7 – Analytics, Compliance & Hardening](../food-delivery-backend/plan.md#sprint-7--analytics-compliance--hardening-weeks-14-15)._
5. **Admin Console (Priority 4)**
   - Global monitoring (map of active orders/riders), user management, marketing campaign launcher, SLA dashboards.
   - Configuration panels for notification templates, payment/tax rules, multi-outlet management.
   - _Backend alignment: [Sprint 6 – Notifications & Ops](../food-delivery-backend/plan.md#sprint-6--notifications--ops-weeks-12-13) & [Sprint 7 – Analytics, Compliance & Hardening](../food-delivery-backend/plan.md#sprint-7--analytics-compliance--hardening-weeks-14-15)._

## Experience Structure
- **Public Website:**
  - Landing page with hero, featured restaurants, CTA to order, and clear links to About, Contact, and Services pages.
  - `About` page telling the Urban Cafe story, sustainability commitments, and partner testimonials.
  - `Services` page describing ordering, catering, fleet management, and treasury integrations for merchants.
  - `Contact` page with support channels, branch locations, embedded map, and lead capture form.
- **Ordering Journey (Customers):**
  - Browse → menu detail → cart → checkout (support prepay or COD) → order confirmation.
  - Real-time order tracking view with status timeline and map.
  - Profile area for address management, saved payment methods, loyalty, and receipts.
  - _Backend references: [Sprint 3 – Orders & Cart](../food-delivery-backend/plan.md#sprint-3--orders--cart-weeks-6-7), [Sprint 4 – Payments Core](../food-delivery-backend/plan.md#sprint-4--payments-core-weeks-8-9)._
- **Driver App Group:**
  - Shift management (clock-in/out), order queue, navigation hand-off, proof of delivery capture.
  - Earnings dashboard with payouts sourced from `treasury-app`, payout history, and tax document downloads.
  - _Backend references: [Sprint 5 – Fulfilment & Dispatch](../food-delivery-backend/plan.md#sprint-5--fulfilment--dispatch-weeks-10-11) & treasury integrations in [Payments & Treasury Integration](../food-delivery-backend/plan.md#payments--treasury-integration-priority-3)._
- **Admin/Staff Portal:**
  - Multi-tenant dashboard to manage orders, inventory, riders, staff schedules, and promotions.
  - SLA monitoring, escalation workflows, and manual adjustments synced with treasury settlements.
  - Notification rule builder hooked into `notifications-app` for templated campaigns and alerts.
  - _Backend references: [Sprint 6 – Notifications & Ops](../food-delivery-backend/plan.md#sprint-6--notifications--ops-weeks-12-13) & [Sprint 7 – Analytics, Compliance & Hardening](../food-delivery-backend/plan.md#sprint-7--analytics-compliance--hardening-weeks-14-15)._

> Refer to [`docs/information-architecture-checklist.md`](docs/information-architecture-checklist.md) when auditing wireframes to ensure each experience group is covered.

## Tooling & Architecture
- **Frameworks:** Next.js 15 (App Router), React Native 0.74+, Expo for rapid builds, Capacitor PWA enhancements.
- **State & Data:** TanStack Query for server state, Zustand for lightweight client state, React Hook Form + Zod validation, Jotai for low-level atoms where needed.
- **Networking:** Axios via shared `baseapi` wrapper, WebSocket/SSE client for live updates, service worker API for offline sync.
- **UI System:** Tailwind CSS + Radix UI (web), NativeWind (mobile), Figma handoff tokens synced through Style Dictionary.
- **Maps & Geo:** Mapbox GL JS (web) and mapbox/react-native-mapbox-gl, fallback to Google Maps if required.
- **Internationalization:** next-intl (web) & react-native-localize + i18next (mobile), centralized copy JSON with translation pipeline.
- **Testing & Quality:** Vitest + Testing Library, Detox/E2E for mobile, Playwright for PWA, Percy visual testing.
- **Analytics:** Segment/Amplitude instrumentation, consent-aware tracking toggles.
  - Theming tokens now hydrate from CSS variables; upcoming backend sync will persist look & feel per tenant.
  - _Backend alignment: Observability & analytics hooks tie into [Cross-Cutting Concerns – Observability](../food-delivery-backend/plan.md#cross-cutting-concerns)._

## Cross-Cutting Concerns
- **Offline & Performance:** service worker caching strategies (App Shell, stale-while-revalidate), background sync for failed actions, skeleton loading states, Lighthouse score targets (Performance 90+, PWA badge).
- **Accessibility:** Semantic components, keyboard navigation, color contrast validation (axe), accessible map alternatives.
- **Security & Privacy:** Secure storage (expo-secure-store), CSRF protection, input sanitization, session renewal flows, telemetry anonymization.
- **Dev Experience:** Monorepo with Turborepo, Storybook for design review, linting (ESLint, Stylelint), Prettier config, Husky pre-commit hooks.
- **Responsive & PWA-Ready:** Every page, including admin and driver flows, must be responsive (mobile, tablet, desktop) with installable PWA support so users can run the experience without separate native builds.

## Integration Points
- **Backend APIs:** Strict contract via OpenAPI, shared TypeScript types (tRPC or openapi-typescript) to avoid drift.
- **`notifications-app`:** Subscription management UI, template preview, user channel preferences, and consumption of notification delivery receipts for in-app status chips.
- **`treasury-app`:** Payment status polling, rider/cafe wallet balances, payout visibility, and surface of treasury settlement timelines inside the operations dashboards.
- **Push Providers:** Firebase Cloud Messaging for Android/web, Apple Push Notifications, plus SMS fallback toggles.
  - _Backend alignment: See [External Integrations & Dependencies](../food-delivery-backend/plan.md#external-integrations--dependencies) in the backend plan._

## Known Gaps
- Forms currently simulate submissions; backend endpoints for KYC, tenant provisioning, and OAuth callbacks are required.
- Staff portal authentication awaits invitation token verification API and session management.
- Rider and merchant dashboards will ship after orders, payouts, and analytics APIs are available.

## Delivery Roadmap (Priority-Ordered Sprints)
1. **Sprint 0 – Foundations & Design System (Week 1)**
   - Setup monorepo, Next.js shell, React Native/Expo workspace, shared UI kit, Storybook, lint/test pipelines.
   - Define routing architecture, internationalization scaffolding, theming tokens.
   - _Backend link: [Sprint 0 – Foundation](../food-delivery-backend/plan.md#sprint-0--foundation-week-1)._
2. **Sprint 1 – Customer Web MVP (Weeks 2-3)**
   - Landing page, menu listing, product detail, cart UI, auth flows (login/register/OTP), TanStack Query data hooks.
   - Integrate baseapi client, skeleton state management, analytics instrumentation baseline.
   - Progress: marketing surface, rider/merchant CTAs, and base brand theming delivered.
   - _Backend link: [Sprint 1 – Identity & Access](../food-delivery-backend/plan.md#sprint-1--identity--access-management-weeks-2-3) & [Sprint 2 – Catalog & Localization](../food-delivery-backend/plan.md#sprint-2--catalog--localization-weeks-4-5)._
3. **Sprint 2 – Checkout & Payments UX (Weeks 4-5)**
   - Checkout form, address management, promo/loyalty handling, payment orchestration UI (treasury integration), order confirmation.
   - Error handling patterns, accessibility pass for core journey.
   - _Backend link: [Sprint 4 – Payments Core](../food-delivery-backend/plan.md#sprint-4--payments-core-weeks-8-9)._
4. **Sprint 3 – Real-Time Tracking & Notifications (Weeks 6-7)**
   - Live order status timeline, map tracking, WebSocket integration, notification preferences, service worker push support.
   - _Backend link: [Sprint 5 – Fulfilment & Dispatch](../food-delivery-backend/plan.md#sprint-5--fulfilment--dispatch-weeks-10-11) & [Sprint 6 – Notifications & Ops](../food-delivery-backend/plan.md#sprint-6--notifications--ops-weeks-12-13)._
5. **Sprint 4 – Cafe Dashboard (Weeks 8-9)**
   - Authenticated dashboard layout, order queue management, menu CRUD, promo scheduler, analytics overview.
   - Role-based routing, optimistic updates, multi-language management.
   - _Backend link: [Sprint 2 – Catalog & Localization](../food-delivery-backend/plan.md#sprint-2--catalog--localization-weeks-4-5) & [Sprint 7 – Analytics, Compliance & Hardening](../food-delivery-backend/plan.md#sprint-7--analytics-compliance--hardening-weeks-14-15)._
6. **Sprint 5 – Mobile Apps Phase 1 (Weeks 10-11)**
   - Customer React Native app parity (auth, menu, cart, checkout), offline cart caching, biometric login.
   - Deploy internal beta via Expo EAS/TestFlight.
   - _Backend link: [Sprint 5 – Fulfilment & Dispatch](../food-delivery-backend/plan.md#sprint-5--fulfilment--dispatch-weeks-10-11)._
7. **Sprint 6 – Rider App & Fulfillment (Weeks 12-13)**
   - Rider order queue, navigation integration, proof-of-delivery capture, earnings dashboard.
   - Background location tracking, push notifications, offline resilience.
   - _Backend link: [Sprint 5 – Fulfilment & Dispatch](../food-delivery-backend/plan.md#sprint-5--fulfilment--dispatch-weeks-10-11) & [Sprint 6 – Notifications & Ops](../food-delivery-backend/plan.md#sprint-6--notifications--ops-weeks-12-13)._
8. **Sprint 7 – Admin Console & Ops Tooling (Weeks 14-15)**
   - Admin analytics, marketing campaign management, notification template preview, SLA dashboards.
   - Advanced filters, export flows, real-time fleet map.
   - _Backend link: [Sprint 7 – Analytics, Compliance & Hardening](../food-delivery-backend/plan.md#sprint-7--analytics-compliance--hardening-weeks-14-15)._
9. **Sprint 8 – Hardening & Launch (Week 16)**
   - Cross-platform QA, localization polish, performance tuning, app store submissions, PWA audits, documentation handover.
   - _Backend link: [Sprint 8 – Launch & Handover](../food-delivery-backend/plan.md#sprint-8--launch--handover-week-16)._

## Backlog & Enhancements
- AI-driven recommendations & upsell banners, live chat support widget, referral programs, queue-based loyalty rewards, white-label theming for multi-brand expansion.
- Advanced rider route optimization, shift bidding, tip management, micro-interactions for user delight.

---
**Next Steps:** Align with backend on contract-first API specs, finalize component library scope, and lock UX milestones with stakeholders.

## Runtime Ports & Environments
- **Local development:** consume backend at `http://localhost:4000`, treasury at `http://localhost:4001`, and notifications at `http://localhost:4002` when running services locally.
- **Cloud deployment:** all backend ingress endpoints terminate on port **4000**, so the frontend uses public DNS (e.g. `https://fooddeliveryapi.codevertexitsolutions.com`) without port suffixes.

