# Contributing

Thank you for helping build the BengoBox Food Delivery experience. This guide outlines how to propose changes safely and effectively.

## Prerequisites

- Node.js ≥ 20.11 & pnpm ≥ 9
- Familiarity with Next.js App Router, TanStack Query, and Tailwind CSS
- Access to service credentials (treasury + notifications) via Vault

## Workflow

1. Fork or create a feature branch from `main`: `git checkout -b feature/{ticket}`
2. Run `pnpm install` and `pnpm lint && pnpm typecheck`
3. Add or update tests (`pnpm test`). Include Storybook stories for new UI primitives
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/): `feat: add loyalty banner`
5. Open a pull request with:
   - Summary of the change and rationale
   - Screenshots/GIFs for UI updates
   - Checklist confirming lint, tests, typecheck, and docs updated
6. Request two reviews (frontend + product). Address feedback promptly

## Coding Standards

- Use the shared Axios `baseapi` client for all network traffic (no `fetch`)
- Keep components accessible (ARIA roles, keyboard support, colour contrast)
- Prefer functional React components with hooks; avoid legacy class components
- Use TanStack Query for server state, Zustand for local state, React Hook Form + Zod for forms
- Keep Tailwind classes consistent; leverage `class-variance-authority` for variants

## Testing Expectations

- Unit tests for each component or hook with meaningful behavioural coverage
- Integration tests for route-level changes involving data fetching or complex interactions
- Update Playwright flows when end-to-end behaviour changes (if applicable)

## Documentation

Update or create docs under `docs/` when modifying architectures, workflows, or APIs. Ensure the [`docs/documentation-guide.md`](docs/documentation-guide.md) index references any new files.

## Code Review Checklist

- [ ] Lint, typecheck, and tests pass locally
- [ ] New UI verified in Storybook when practical
- [ ] Accessibility and localisation considerations addressed
- [ ] Screenshots for visual changes
- [ ] Rollout/rollback plan summarised (feature flag, config toggle)

By contributing, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).
