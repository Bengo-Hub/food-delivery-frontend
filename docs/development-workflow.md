# Development Workflow

## Prerequisites

- Node.js ≥ 20.11 (LTS) with pnpm ≥ 9
- Docker (optional) for running dependent services (Redis, Postgres, API gateways)
- Access to shared `.env` secrets vault (Vault/Azure Key Vault)

## Local Setup

```bash
pnpm install
pnpm dev
```

- Run the backend stack (`food-delivery-backend`, `treasury-app`, `notifications-app`) locally or point `NEXT_PUBLIC_API_URL` to staging.
- Storybook: `pnpm storybook` (runs on port 6006 by default).
- Tests: `pnpm test` (Vitest), `pnpm test --watch` for TDD flow.

## Branching & Releases

- Follow **trunk-based** development with short-lived feature branches: `feature/{ticket}`, `fix/{issue}`.
- Use **Conventional Commits** (`feat:`, `fix:`, `docs:`) to power semantic releases.
- Pull requests require:
  - Green lint, typecheck, and test pipelines
  - Storybook update screenshots if UI changes
  - Relevant documentation updates when behaviour changes

## Code Quality Gates

- `pnpm lint` – ESLint flat config leveraging Next core web vitals and TypeScript rules
- `pnpm typecheck` – strict compilation without emitting
- `pnpm test` – unit/integration tests via Vitest + Testing Library
- Visual QA – verify new screens against design tokens (`tailwind.config.ts`) and ensure responsive behaviour at xs/sm/md/lg breakpoints in mobile + PWA install mode.
- Visual regression (Percy) and Playwright E2E will be added before GA launch.

## Environment Promotion

1. **Dev** – Feature validation, mocked integrations
2. **Staging** – Parity with production, synthetic monitoring
3. **Production** – Blue/green or canary releases via ArgoCD

Feature flags managed through the treasury platform. Release toggles stored in `src/lib/config/feature-flags.ts` (to be implemented).

## Observability & Monitoring

- Use the Next instrumentation API (`src/instrumentation.ts`) to forward web vitals to Grafana/Prometheus.
- Console logs are kept minimal in production; prefer structured logging via `@/lib/logger` (coming soon).
- Sentry/Highlight integration is planned for error tracing.
