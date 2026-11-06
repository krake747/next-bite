# Toolchain

`vp` (Vite+) owns the toolchain. It delegates packages to `pnpm`. Prefer `package.json` scripts over
ad hoc commands. Owned values live in `sources-of-truth.md`; this file holds commands only.

## Package manager

`pnpm` via `vp install`. Never `npm` or `yarn`.

```
vp install            # install dependencies (via pnpm)
pnpm add <pkg>        # add dependency
pnpm add -D <pkg>     # add dev dependency
```

Node floor lives in `package.json` `engines`, pinned in `.node-version`.

## Build

```
pnpm build    # vp build (production bundle)
pnpm dev      # vp dev (dev server)
```

## Lint & format

```
pnpm fmt:check     # vp fmt --check
pnpm fmt           # vp fmt --no-error-on-unmatched-pattern
pnpm lint          # vp lint
pnpm lint:ts       # TypeScript type-check (noEmit)
pnpm lint:fix      # vp lint --fix
```

Lint and format config lives in `vite.config.ts`, not in separate dotfiles.

## Boundary checks

```
pnpm fallow audit    # layer violations, unused deps, dead files (error on boundary violations)
```

Zones and import rules live in `.fallowrc.json`.

## Testing

```
pnpm test                 # Vitest (all tiers)
pnpm test:pure            # logic with no DOM
pnpm test:unit            # hooks and isolated UI
pnpm test:browser         # full interaction components
pnpm test:integration     # route-level and backend contracts
pnpm test:watch           # Vitest watch mode
pnpm test:e2e             # Playwright gate on a local Worker preview (needs browsers plus wrangler)
```

Tiers live in `vite.config.ts` projects. See `testing.md`. The Playwright suite lives in `e2e/` with
config in `playwright.config.ts`. Install browsers once with
`npx playwright install chromium --only-shell`, then run `pnpm test:e2e`. It builds the production
Worker bundle and serves it with wrangler on port 5193, so the suite proves the built SSR boundary
rather than the dev server. Point `E2E_BASE_URL` at a dev server with `E2E_NO_SERVER=1` set when
iterating quickly. It stays out of the push gate and CI by design; run it on demand and before
release.

## Convex

```
pnpm convex:dev      # local dev server
pnpm convex:deploy   # deploy to production
```

Schema in `convex/schema.ts`. Read `convex/_generated/ai/guidelines.md` before writing Convex code.
Migrations live in `docs/migrations.md`.

## Deploy

```
pnpm deploy    # cf deploy (builds, then uploads dist/ as Worker assets)
```

Hosting is an asset-only Cloudflare Worker with SPA fallback, configured in `cloudflare.config.ts`.
Validated runtime settings: worker name `next-bite`, compatibility date `2026-11-03`, server entry
`src/server.ts` (TanStack Start handler), assets with single-page-application fallback. `VITE_*`
values bake in at build time. The `cf` build does not read `.env.production.local`, so export the
values in your shell first:

```
set -a; . ./.env.production.local; set +a; pnpm deploy
```

Deploying needs `cf auth login` or `CLOUDFLARE_API_TOKEN`. See ADR-0008. Ask a human before
deploying; never print secret values.

## Anonymous SSR boundary

The server never holds a session, so anonymous SSR renders public shells only, never private data.
Proven by the Playwright gate against the Worker preview:

- Public routes render server-side: `/` and `/design-system` plus the Friends, Groups, and You stubs
  assert headings in raw HTML, with zero client-render fallbacks and zero hydration page errors
  across the painted journeys.
- Restaurant detail renders the loading shell anonymously: no name, notes, photos, or social
  content, with the static details title as the metadata ceiling. Resolvable-but-invisible records
  paint the not-found card once the client confirms no access; unresolvable IDs stay on the shell
  because the query rejects.
- Auth state starts unknown on both server and first client render (`isLoading: true`), so hydration
  matches and resolved auth arrives as a normal post-hydration update. Do not gate children behind
  client-only placeholders in `AuthProvider`; it breaks hydration on every page.

## Release

Releases ship from `main` via the manual `release.yml` workflow (`workflow_dispatch` with
`patch`/`minor`/`major` plus a dry-run flag). It gates on PR CI, builds, deploys with `cf`, then
tags and publishes a GitHub Release. See ADR-0009.

## Verification chain

Run `pnpm check:full` before considering work done (stop at first failure). Gate commands live in
`package.json`; the local pre-push gate is `pnpm check`. See `ci-gate.md`.

```
pnpm fmt:check     # formatting
pnpm lint          # lint
pnpm lint:ts       # TypeScript type-checking
pnpm build         # production build
pnpm fallow audit  # layer boundaries + unused code
pnpm test          # Vitest (all tiers)
```

The lefthook pre-push hook runs `pnpm check`. Never push with `--no-verify`.
