# Toolchain

`vp` (Vite+) owns the toolchain. It delegates packages to `pnpm`. Prefer `package.json` scripts over
ad hoc commands.

## Package manager

`pnpm` v12, Node 26 (pinned by `.node-version`). Never `npm` or `yarn`.

```
vp install            # install dependencies (via pnpm)
pnpm add <pkg>        # add dependency
pnpm add -D <pkg>     # add dev dependency
```

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

`fmt` and `lint` config lives in `vite.config.ts`, not in separate dotfiles.

## Boundary checks

```
pnpm fallow audit    # layer violations, unused deps, dead files (error on boundary violations)
```

`.fallowrc.json` defines the layered architecture. See `AGENTS.md` > Layers for the full zone table.
Boundary violations block build.

## Testing

```
pnpm test                 # Vitest (all tiers)
pnpm test:pure            # logic with no DOM
pnpm test:unit            # hooks and isolated UI
pnpm test:browser         # full interaction components
pnpm test:integration     # route-level and backend contracts
pnpm test:watch           # Vitest watch mode
```

## Convex

```
pnpm convex:dev      # local dev server
pnpm convex:deploy   # deploy to production
```

Schema in `convex/schema.ts`. Queries (`query`), mutations (`mutation`), and actions (`action`) in
`convex/`.

## Deploy

```
pnpm deploy    # cf deploy (builds, then uploads dist/ as Worker assets)
```

Hosting is an asset-only Cloudflare Worker (`next-bite`) with SPA fallback, configured in
`cloudflare.config.ts`. `VITE_*` values bake in at build time. The `cf` build does not read
`.env.production.local`, so export the values in your shell first:

```
set -a; . ./.env.production.local; set +a; pnpm deploy
```

Deploying needs `cf auth login` or `CLOUDFLARE_API_TOKEN`. See
[ADR-0008](../adr/0008-cloudflare-workers-assets.md).

## Verification chain

Run `pnpm check:full` before committing (stop at first failure). It runs each gate in order:

```
pnpm fmt:check     # formatting
pnpm lint          # lint
pnpm lint:ts       # TypeScript type-checking
pnpm build         # production build
pnpm fallow audit  # layer boundaries + unused code
pnpm test          # Vitest unit + browser tests
```

The lefthook pre-push hook runs `pnpm check`. Never push with `--no-verify`.
