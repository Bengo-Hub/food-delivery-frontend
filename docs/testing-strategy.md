# Testing Strategy

## Pyramid Overview

1. **Unit Tests (70%)** – Components, hooks, and utilities using Vitest + Testing Library. Snapshot testing limited to deterministic UI primitives.
2. **Integration Tests (20%)** – Route-level behaviours with mock service workers (MSW) covering API interactions through `baseapi`.
3. **End-to-End Tests (10%)** – Playwright flows validating checkout, onboarding, and multi-tenant switching (coming soon).

## Tooling

- **Vitest** configured in `vitest.config.ts`
- **Testing Library** for DOM assertions (`@testing-library/react`, `@testing-library/jest-dom`)
- **MSW** for HTTP mocking (to be added)
- **Storybook Chromatic/Percy** for visual regression (optional stage)

## Conventions

- Tests colocated next to source files: `Component.spec.tsx`
- Use `describe`/`it` blocks with behavioural naming: `"should display rider ETA"`
- Mock network calls by intercepting `baseapi` (never stub `fetch`) to ensure parity with production code paths
- Ensure accessibility by asserting on roles, labels, and states

## Coverage Targets

- **Statements/Branches:** ≥ 80%
- **Critical flows (checkout, order tracking):** ≥ 95%
- Coverage enforced at CI level using `vitest --coverage` once implemented

## CI Integration

- GitHub Actions pipeline runs lint, typecheck, unit tests, and coverage checks before merging to main
- Playwright E2E suite triggered nightly and on release candidates

Document test fixtures and shared utilities in `src/tests/README.md` when added.
