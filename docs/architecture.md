# Architecture Overview

## High-Level Design

- **App Router:** All routes live in `src/app`. Layouts manage metadata, theming, and shared shells.
- **Providers:** `AppProviders` wraps the tree with TanStack Query, Theme, and any future context (Zustand, analytics).
- **State management:**
  - Server state → TanStack Query via the mandatory Axios `baseapi` client
  - Client state → Zustand slices colocated by domain (e.g. `src/stores/order.ts`)
  - Forms → React Hook Form + Zod schema validation
- **Styling:** Tailwind CSS with tokens defined in `tailwind.config.ts`, class-variance-authority for primitives, dark mode via `next-themes`.
- **Internationalisation:** `next-intl` for locale-aware routing and translations (EN/SW baseline). Translation messages will live in `src/i18n/locales`.
- **Real-time features:** WebSockets/SSE client modules will be registered under `src/lib/realtime`. Query invalidation is managed through TanStack Query observers.

## Directory Layout

```
src/
  app/                  # Route groups, layouts, server components
  components/
    layout/             # Shell components (header, footer, nav)
    primitives/         # Design system primitives (buttons, inputs, badge)
    sections/           # Marketing and app sections
  hooks/                # Custom React hooks (TanStack Query wrappers, forms)
  lib/                  # Axios baseapi client, query client, utilities
  providers/            # Context providers and managers
  styles/               # Tailwind CSS entry points
```

Future directories:

- `src/i18n/` – message catalogues, locale utilities
- `src/stores/` – Zustand slices for local state
- `src/tests/` – Vitest configuration helpers and test utils
- `src/storybook/` – shared decorators and stories configuration

## Integration Touchpoints

- **Food Delivery backend:** Contract-first OpenAPI schemas generate shared client types.
- **Treasury app:** Payment status, wallet balance, loyalty ledger surfaces via baseapi endpoints.
- **Notifications app:** Opt-in preferences, message history, marketing campaign management.
- **Analytics:** Segment/Amplitude instrumentation (guarded by consent) forwarded to product analytics pipelines.

## Observability

- Client logs annotated with correlation IDs (from backend) and persisted via browser logging service when available.
- Web vitals reported using the Next.js instrumentation hook to Prometheus compatible endpoint.
- Feature usage tracked through analytics wrappers in `src/lib/analytics` (to be added).

## Security & Compliance

- Enforce OAuth/OpenID Connect flows via backend-provided PKCE. Sensitive tokens stored with `expo-secure-store` (mobile) or `IndexedDB` (web) through the base SDK.
- Apply Content Security Policy (CSP) headers via Next middleware before production launch.
- Follow accessibility guidelines (WCAG 2.1 AA) and maintain localization coverage.
