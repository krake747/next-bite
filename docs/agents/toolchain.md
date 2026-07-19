# Toolchain

## Package manager

`pnpm` v11. Never `npm` or `yarn`.

```
pnpm install              # install all workspace deps
pnpm add <pkg> -w         # add to root workspace
pnpm add -D <pkg> -w      # add dev dep to root workspace
pnpm add <pkg> --filter @next-bite/sandcastle-tools  # add to sandcastle workspace
```

## Build

```
pnpm build    # tsc -b (type-check) + vite build
pnpm dev      # vite dev server
```

## Lint & format

```
pnpm fmt:check     # oxfmt check
pnpm fmt           # oxfmt write
pnpm lint          # oxlint
pnpm lint:ts       # TypeScript type-check (noEmit)
pnpm lint:fix      # oxlint --fix
```

## Boundary checks

```
pnpm fallow audit    # layer violations, unused deps, dead files (error on boundary violations)
```

`.fallowrc.json` defines the layered architecture. See `AGENTS.md` > Layers for the full zone table.
Boundary violations block build.

## Testing

```
pnpm test         # Vitest (unit + browser)
pnpm test:watch   # Vitest watch mode
pnpm test:e2e     # Playwright E2E
pnpm test:all     # Vitest + Playwright
```

## Convex

```
pnpm convex:dev      # local dev server
pnpm convex:deploy   # deploy to production
```

Schema in `convex/schema.ts`. Queries (`query`), mutations (`mutation`), and actions (`action`) in
`convex/`.

## Verification chain

Run before committing (stop at first failure):

```
pnpm fmt:check
pnpm lint
pnpm lint:ts
pnpm build
pnpm fallow audit
pnpm test
pnpm test:e2e
```

## Sandcastle

```
pnpm sandcastle:build    # build Docker image
pnpm sandcastle:run      # run sandcastle agent loop
```

Sandcastle config lives in `.sandcastle/main.ts`. Prompts in `.sandcastle/*-prompt.md`. Linear CLI
wrapper at `.sandcastle/linear`. Requires `.sandcastle/.env` with auth tokens.
