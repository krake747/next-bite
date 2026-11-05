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
```

Tiers live in `vite.config.ts` projects. See `testing.md`.

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
`VITE_*` values bake in at build time. The `cf` build does not read `.env.production.local`, so
export the values in your shell first:

```
set -a; . ./.env.production.local; set +a; pnpm deploy
```

Deploying needs `cf auth login` or `CLOUDFLARE_API_TOKEN`. See ADR-0008. Ask a human before
deploying; never print secret values.

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
