# Agent Guidelines

## Tech stack

- React 19, TypeScript, Tailwind CSS v4, Vite+ (`vp`) toolchain
- TanStack Start (SSR shell on Workers) + Router (file-based routing), TanStack Query (server state)
- Convex (backend: realtime DB, auth, file storage)
- Base UI (headless primitives)
- Vitest in tiers (pure, unit, browser, integration)
- `vp` (lint + format)
- fallow (layer boundary enforcement, unused code detection)

## Style

- Use `pnpm` as the package manager. Never `npm` or `yarn`.
- We develop on WSL within Windows.
- Types over interfaces. Never cast types; fix at source instead.
- Read env only through `src/core/env.ts`. Never read `import.meta.env` at a call site.
- React Compiler owns memoization. Do not add `useMemo`, `useCallback`, or `React.memo`.
- Do not add comments unless explicitly asked.
- When comments are needed, do not use em dashes. Use periods, commas, or colons instead.
- Follow existing patterns in the codebase for component structure, file naming, and module
  organization.
- When in planning mode and something is unclear, ask questions one at a time (like a quiz). Wait
  for each answer before asking the next question. Only after all questions are answered and you
  have no remaining uncertainties, present the final plan.

## Design system

The visual identity is Tomato and Butter on Stone neutrals, light only. Bricolage Grotesque for
display, DM Sans for interface. The living inventory lives at `/design-system` and renders the real
components; `registry.json` distributes source when asked.

- Use semantic Tailwind tokens (`bg-background`, `text-muted-foreground`, `border-border`,
  `bg-primary`, `text-destructive`). Never scatter raw hex values in components.
- Use Base UI for accessible interactive primitives. Never adopt a second component implementation
  alongside one. Compose Base UI primitives into styled application components.
- Use CVA for reusable component variants. Reuse components from `src/ui`. Keep domain-specific
  components in feature directories. Prefer composition over duplicated implementations.
- Wrappers own their color, typography, spacing, and motion (`shadcn/no-restyle` enforced). Call
  sites may only pass layout classes and must use variants for the rest.
- Do not introduce dark mode or `.dark` styles.
- Interest is Tomato for Want to try and Basil for Been there, always with a text label. Never
  communicate state through colour alone.

## Layers

Code lives in `src/` under these zones (enforced by fallow boundary rules):

| Zone        | Purpose                                                        | May import from                             |
| ----------- | -------------------------------------------------------------- | ------------------------------------------- |
| `core/`     | Shared utilities, types, Zod schemas, hooks with no UI         | core, convex, ui                            |
| `ui/`       | Base UI wrappers, low-level components                         | core, ui                                    |
| `pattern/`  | Composable patterns (cards, empty states, top bars)            | core, ui, pattern, convex                   |
| `features/` | Feature-specific logic, one zone per area (restaurants, wheel) | core, ui, pattern, features, convex         |
| `routes/`   | File-based TanStack Router pages                               | core, ui, pattern, features, convex, routes |
| `convex/`   | Backend (schema, queries, mutations, actions)                  | convex, core                                |

## Verification chain

Run `pnpm check:full` before considering work done. It runs these gates in order (stop at first
failure):

```
pnpm fmt:check     # formatting
pnpm lint          # lint
pnpm lint:ts       # TypeScript type-checking
pnpm build         # production build
pnpm fallow audit  # layer boundaries + unused code
pnpm test          # Vitest (all tiers)
```

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (krake747/next-bite), MCP first with the `gh` CLI as fallback.
See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles use the default label names. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `GLOSSARY.md` at repo root, ADRs under `docs/adr/`. See
`docs/agents/domain.md`.

### Testing

Vitest in tiers (pure, unit, browser, integration). See `docs/agents/testing.md`.

### Toolchain

Build, lint, and test commands. See `docs/agents/toolchain.md`.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for
important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.

<!-- convex-ai-end -->
