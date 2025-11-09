# Food Delivery Frontend Delivery Plan

## Vision & Experience Principles
- Deliver a unified Urban Cafe experience across web (Next.js), PWA, and mobile clients (React Native) with localized (EN/SW) content, offline resilience, and real-time delivery visibility.
- Uphold brand palette (chocolate brown, orange, white) and accessibility (WCAG 2.1 AA) while ensuring sub-second perceived performance.
- Leverage shared design tokens and component libraries to keep feature parity between customer, rider, cafe, and admin touchpoints.

## Client Applications & Feature Scope
1. **Customer Web/PWA (Priority 1)**
   - Menu browsing with category filters, dietary tags, search, and personalized recommendations.
   - Cart, promo codes, loyalty balance display, multi-address checkout with payment orchestration (via treasury APIs).
   - Real-time order tracker (map view, status timeline), push/SMS opt-in, order history & reordering.
   - Account management, language toggle, support ticket initiation.
2. **Customer Mobile App (React Native) (Priority 2)**
   - Mirrors web functionality with mobile-native navigation (React Navigation), biometric login, deep linking from SMS/Push.
   - Offline cart retention, network status awareness, background geolocation permissions management.
3. **Rider Mobile App (Priority 3)**
   - Shift sign-in, order queue with accept/decline, turn-by-turn navigation via Mapbox/Google SDK, proof of delivery (photo, code).
   - Earnings dashboard, daily summary, issue reporting.
4. **Cafe Dashboard (Priority 3)**
   - Order queue management, kitchen display mode, stock-out actions, driver assignment overrides.
   - Menu CRUD, price scheduling, promotion builder, operations analytics snapshots.
5. **Admin Console (Priority 4)**
   - Global monitoring (map of active orders/riders), user management, marketing campaign launcher, SLA dashboards.
   - Configuration panels for notification templates, payment/tax rules, multi-outlet management.

## Tooling & Architecture
- **Frameworks:** Next.js 15 (App Router), React Native 0.74+, Expo for rapid builds, Capacitor PWA enhancements.
- **State & Data:** TanStack Query for server state, Zustand for lightweight client state, React Hook Form + Zod validation, Jotai for low-level atoms where needed.
- **Networking:** Axios via shared `baseapi` wrapper, WebSocket/SSE client for live updates, service worker API for offline sync.
- **UI System:** Tailwind CSS + Radix UI (web), NativeWind (mobile), Figma handoff tokens synced through Style Dictionary.
- **Maps & Geo:** Mapbox GL JS (web) and mapbox/react-native-mapbox-gl, fallback to Google Maps if required.
- **Internationalization:** next-intl (web) & react-native-localize + i18next (mobile), centralized copy JSON with translation pipeline.
- **Testing & Quality:** Vitest + Testing Library, Detox/E2E for mobile, Playwright for PWA, Percy visual testing.
- **Analytics:** Segment/Amplitude instrumentation, consent-aware tracking toggles.

## Cross-Cutting Concerns
- **Offline & Performance:** service worker caching strategies (App Shell, stale-while-revalidate), background sync for failed actions, skeleton loading states, Lighthouse score targets (Performance 90+, PWA badge).
- **Accessibility:** Semantic components, keyboard navigation, color contrast validation (axe), accessible map alternatives.
- **Security & Privacy:** Secure storage (expo-secure-store), CSRF protection, input sanitization, session renewal flows, telemetry anonymization.
- **Dev Experience:** Monorepo with Turborepo, Storybook for design review, linting (ESLint, Stylelint), Prettier config, Husky pre-commit hooks.

## Integration Points
- **Backend APIs:** Strict contract via OpenAPI, shared TypeScript types (tRPC or openapi-typescript) to avoid drift.
- **`notifications-app`:** Subscription management UI, template preview, user channel preferences, and consumption of notification delivery receipts for in-app status chips.
- **`treasury-app`:** Payment status polling, rider/cafe wallet balances, payout visibility, and surface of treasury settlement timelines inside the operations dashboards.
- **Push Providers:** Firebase Cloud Messaging for Android/web, Apple Push Notifications, plus SMS fallback toggles.

## Delivery Roadmap (Priority-Ordered Sprints)
1. **Sprint 0 – Foundations & Design System (Week 1)**
   - Setup monorepo, Next.js shell, React Native/Expo workspace, shared UI kit, Storybook, lint/test pipelines.
   - Define routing architecture, internationalization scaffolding, theming tokens.
2. **Sprint 1 – Customer Web MVP (Weeks 2-3)**
   - Landing page, menu listing, product detail, cart UI, auth flows (login/register/OTP), TanStack Query data hooks.
   - Integrate baseapi client, skeleton state management, analytics instrumentation baseline.
3. **Sprint 2 – Checkout & Payments UX (Weeks 4-5)**
   - Checkout form, address management, promo/loyalty handling, payment orchestration UI (treasury integration), order confirmation.
   - Error handling patterns, accessibility pass for core journey.
4. **Sprint 3 – Real-Time Tracking & Notifications (Weeks 6-7)**
   - Live order status timeline, map tracking, WebSocket integration, notification preferences, service worker push support.
5. **Sprint 4 – Cafe Dashboard (Weeks 8-9)**
   - Authenticated dashboard layout, order queue management, menu CRUD, promo scheduler, analytics overview.
   - Role-based routing, optimistic updates, multi-language management.
6. **Sprint 5 – Mobile Apps Phase 1 (Weeks 10-11)**
   - Customer React Native app parity (auth, menu, cart, checkout), offline cart caching, biometric login.
   - Deploy internal beta via Expo EAS/TestFlight.
7. **Sprint 6 – Rider App & Fulfillment (Weeks 12-13)**
   - Rider order queue, navigation integration, proof-of-delivery capture, earnings dashboard.
   - Background location tracking, push notifications, offline resilience.
8. **Sprint 7 – Admin Console & Ops Tooling (Weeks 14-15)**
   - Admin analytics, marketing campaign management, notification template preview, SLA dashboards.
   - Advanced filters, export flows, real-time fleet map.
9. **Sprint 8 – Hardening & Launch (Week 16)**
   - Cross-platform QA, localization polish, performance tuning, app store submissions, PWA audits, documentation handover.

## Backlog & Enhancements
- AI-driven recommendations & upsell banners, live chat support widget, referral programs, queue-based loyalty rewards, white-label theming for multi-brand expansion.
- Advanced rider route optimization, shift bidding, tip management, micro-interactions for user delight.

---
**Next Steps:** Align with backend on contract-first API specs, finalize component library scope, and lock UX milestones with stakeholders.

## Runtime Ports & Environments
- **Local development:** consume backend at `http://localhost:4000`, treasury at `http://localhost:4001`, and notifications at `http://localhost:4002` when running services locally.
- **Cloud deployment:** all backend ingress endpoints terminate on port **4000**, so the frontend uses public DNS (e.g. `https://fooddeliveryapi.codevertexitsolutions.com`) without port suffixes.

