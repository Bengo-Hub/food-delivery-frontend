# Food Delivery Frontend

Next.js App Router experience powering the BengoBox Urban Café customer, rider, and operations touchpoints. The project embraces an API-first philosophy, multi-tenant localisation, and offline-friendly UX patterns while integrating tightly with the treasury and notifications services.

## Tech Foundations

- **Framework:** Next.js 15 (App Router) with React 18 and TypeScript
- **Styling:** Tailwind CSS with custom design tokens, class-variance-authority primitives, dark-mode via `next-themes`
- **Data layer:** TanStack Query + Axios `baseapi` client, Zustand for lightweight state, React Hook Form + Zod validation
- **Tooling:** Vitest + Testing Library, Storybook 8, Prettier + ESLint flat config, pnpm workspaces ready
- **Internationalisation:** `next-intl` with locale-aware routing, EN/SW defaults

## Getting Started

```bash
pnpm install
pnpm dev
```

Environment variables live in `.env.local` (not committed). Minimum variables:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SEGMENT_WRITE_KEY=...
```

Helpful scripts:

| Script            | Purpose                                |
| ----------------- | -------------------------------------- |
| `pnpm dev`        | Run Next.js locally with HMR            |
| `pnpm build`      | Type-check and compile production build |
| `pnpm start`      | Start the production server             |
| `pnpm lint`       | ESLint flat config over `src/`          |
| `pnpm test`       | Execute Vitest test suites              |
| `pnpm typecheck`  | Run `tsc --noEmit`                      |
| `pnpm storybook`* | (Add-on) Launch component workbench     |

\*Storybook scaffolding is ready; add stories in `src/components/**/*.stories.tsx`.

## Project Layout

```
src/
  app/           # App Router routes and layouts
  components/    # UI building blocks
  hooks/         # Shared TanStack Query hooks & utilities
  lib/           # Axios baseapi client, helpers, query client
  providers/     # React context and global providers
  styles/        # Tailwind global styles and tokens
```

Key conventions:

- All network calls **must** use `baseapi` from `@/lib/baseapi` (no direct `fetch`).
- Prefer TanStack Query for server state, Zustand for local store, React Hook Form + Zod for forms.
- Keep components accessible, tested, and Storybook-ready.

## Documentation

Extended documentation lives under `docs/` and is indexed in [`docs/documentation-guide.md`](docs/documentation-guide.md). Highlights:

- [`docs/architecture.md`](docs/architecture.md) – high-level architecture and routing strategy
- [`docs/development-workflow.md`](docs/development-workflow.md) – conventions, tooling, and environments
- [`docs/testing-strategy.md`](docs/testing-strategy.md) – testing layers, commands, and coverage expectations

## Community Files

- [`CONTRIBUTING.md`](CONTRIBUTING.md) – branch, commit, and PR workflow
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) – inclusive, safe collaboration expectations
- [`SECURITY.md`](SECURITY.md) – security reporting process
- [`SUPPORT.md`](SUPPORT.md) – support channels and escalation path
- [`CHANGELOG.md`](CHANGELOG.md) – semantic release notes template

## Next Steps

- Align contract-first APIs with `food-delivery-backend` and `treasury-app`
- Expand Storybook stories covering shared design tokens and primitives
- Integrate internationalisation routing scaffolding and translation pipeline
- Add E2E testing harness (Playwright) once core flows are ready
