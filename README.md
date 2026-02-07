# Ordering Service Frontend

**Progressive Web Application (PWA)** for the BengoBox Ordering Service — a customer-focused, app-first (feed-first) mobile-first ordering experience. Built with Next.js App Router, this PWA surfaces the item feed immediately on landing, requests geolocation consent to pick a default outlet, and provides a minimal OAuth2 entrypoint for customers.

**Scope**: This frontend handles **online ordering only**. Rider dashboards, staff/admin dashboards, and POS operations belong to other services (logistics-service, cafe-website, pos-service). Rider/staff flows are intentionally redirected to their owning UIs — this app is customer-only.

## Tech Foundations

- **Framework:** Next.js 15 (App Router) with React 18 and TypeScript
- **PWA:** Service worker with Workbox, offline support, push notifications, install prompts
- **Styling:** Tailwind CSS with custom design tokens, mobile-first responsive design, dark-mode via `next-themes`
- **Data layer:** TanStack Query + Axios `baseapi` client, Zustand for lightweight state, React Hook Form + Zod validation
- **Tooling:** Vitest + Testing Library, Storybook 8, Prettier + ESLint flat config, pnpm workspaces ready
- **Internationalisation:** `next-intl` with locale-aware routing, EN/SW defaults

## PWA Features

- ✅ **Installable**: Add to home screen on mobile and desktop
- ✅ **Offline Support**: Browse cached menu items offline
- ✅ **Push Notifications**: Order status updates and promotions
- ✅ **Mobile-First Design**: Optimized for touch interactions, responsive on all devices
- ✅ **Fast Loading**: Optimized performance with code splitting and lazy loading

## Getting Started

```bash
pnpm install
pnpm dev
```

Environment variables live in `.env.local` (not committed). Minimum variables:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_AUTH_SERVICE_URL=https://sso.codevertexitsolutions.com
NEXT_PUBLIC_LOGISTICS_UI_URL=https://logistics.codevertexitsolutions.com
NEXT_PUBLIC_CAFE_WEBSITE_URL=https://theurbanloftcafe.com

# App-first UX (Design notes)

- Landing behaviour: the landing page is a feed-first experience — on mobile the app shows the available items / outlet menu immediately (no marketing gate). On desktop it shows the same feed / a prominent search bar and outlet selector.
- Geolocation: on first visit the app requests geolocation consent. With consent the app auto-selects the nearest outlet; on denial the app falls back to manual location picker.
- Authentication: OAuth2 entrypoints are minimal and focused on customers. Staff/rider roles are detected after login and redirected to the owning service (`NEXT_PUBLIC_CAFE_WEBSITE_URL` for staff/admin, `NEXT_PUBLIC_LOGISTICS_UI_URL` for riders).
- Branding & Multi-tenant: the frontend supports per-tenant theming via backend-provided `look_and_feel` settings (logo, colors, copy overrides). Tenant and outlet context is required for all ordering API calls.
```

Helpful scripts:

| Script             | Purpose                                 |
| ------------------ | --------------------------------------- |
| `pnpm dev`         | Run Next.js locally with HMR            |
| `pnpm build`       | Type-check and compile production build |
| `pnpm start`       | Start the production server             |
| `pnpm lint`        | ESLint flat config over `src/`          |
| `pnpm test`        | Execute Vitest test suites              |
| `pnpm typecheck`   | Run `tsc --noEmit`                      |
| `pnpm storybook`\* | (Add-on) Launch component workbench     |

\*Storybook scaffolding is ready; add stories in `src/components/**/*.stories.tsx`.

## Project Layout

```
src/
  app/                    # App Router routes and layouts
    dashboard/customer/   # Customer dashboard (ordering-specific)
    dashboard/rider/      # Redirects to logistics-service
    dashboard/staff/      # Redirects to cafe-website/admin
    menu/                 # Menu browsing and ordering
    profile/              # Customer profile management
    riders/signup/        # Redirects to logistics-service
  components/             # UI building blocks
  hooks/                  # Shared TanStack Query hooks & utilities
  lib/                    # Axios baseapi client, helpers, query client
  providers/              # React context and global providers
  styles/                 # Tailwind global styles and tokens
public/
  manifest.json           # PWA manifest
  icons/                  # PWA icons (72x72 to 512x512)
```

Key conventions:

- All network calls **must** use `baseapi` from `@/lib/baseapi` (no direct `fetch`).
- Prefer TanStack Query for server state, Zustand for local store, React Hook Form + Zod for forms.
- Keep components accessible, tested, and Storybook-ready.
- **Service Boundaries**: Rider and staff features redirect to logistics-service and cafe-website respectively.

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

- Align contract-first APIs with `cafe-backend` and `treasury-api`
- Expand Storybook stories covering shared design tokens and primitives
- Integrate internationalisation routing scaffolding and translation pipeline
- Add E2E testing harness (Playwright) once core flows are ready

- Create a `packages/shared` workspace to host shared TypeScript types and utilities used across frontends and worker tooling. See `docs/SHARED-TYPES-EXTRACTION_PLAN.md` for an initial extraction plan.
