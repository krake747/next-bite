# Agent Guidelines

## Tech stack

- React 19, TypeScript, Tailwind CSS v4, Vite
- TanStack Router (file-based routing), TanStack Query (server state)
- Convex (backend: realtime DB, auth, file storage)
- Base UI (headless primitives)
- Playwright (E2E tests)
- oxlint + oxfmt (lint + format)
- fallow (layer boundary enforcement, unused code detection)

## Style

- Use `pnpm` as the package manager. Never `npm` or `yarn`.
- We develop on WSL within Windows.
- Types over interfaces. Never cast types; fix at source instead.
- Do not add comments unless explicitly asked.
- When comments are needed, do not use em dashes. Use periods, commas, or colons instead.
- Follow existing patterns in the codebase for component structure, file naming, and module
  organization.
- When in planning mode and something is unclear, ask questions one at a time (like a quiz). Wait
  for each answer before asking the next question. Only after all questions are answered and you
  have no remaining uncertainties, present the final plan.

## Layers

Code lives in `src/` under these zones (enforced by fallow boundary rules):

| Zone | Purpose | May import from |
|------|---------|-----------------|
| `core/` | Shared utilities, types, Zod schemas, hooks with no UI | core, convex, ui |
| `ui/` | Base UI wrappers, low-level components | core, ui |
| `pattern/` | Composable patterns (cards, empty states, top bars) | core, ui, pattern, convex |
| `features/` | Feature-specific logic (auth, sync, dashboard) | core, ui, pattern, features, convex |
| `routes/` | File-based TanStack Router pages | core, ui, pattern, features, convex, routes |
| `convex/` | Backend (schema, queries, mutations, actions) | convex, core |

## Verification chain

Before considering work done, run these in order (stop at first failure):

```
pnpm fmt:check     # formatting
pnpm lint          # oxlint
pnpm lint:ts       # TypeScript type-checking
pnpm build         # production build
pnpm fallow audit  # layer boundaries + unused code
pnpm test:e2e      # Playwright E2E suite
```

## Agent skills

### Issue tracker

Issues are tracked in Linear (project "next bite") via the official Linear MCP server. See
`docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles use the default label names. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` at repo root, ADRs under `docs/adr/`. See
`docs/agents/domain.md`.
