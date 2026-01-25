# Agent Guidelines

next-bite is a fun restaurant recommendation site built with SolidJS, TypeScript and Tailwind CSS v4.

## Essentials

- Package manager: `pnpm`
- Don't run builds after every change. This is a visual site; assume changes work unless reported otherwise.
- **Typesafety is paramount.** Never cast types; fix at source instead.
- Don't write unnecssary comments unless explicitly requested.
- Follow existing patterns

## Commands

```bash
pnpm dev          # Dev server
pnpm build        # TS + prod build
pnpm preview      # Preview build

pnpm lint         # Lint (oxlint)
pnpm lint:fix     # Fix lint
pnpm fmt          # Format

pnpm convex:dev   # Convex local
```

## Structure

```
src/
  pages/     # Routes
  features/  # Feature logic
  ui/        # Reusable UI
  core/      # Hooks, business logic
```

## Conventions

- **SolidJS patterns only** (signals, memos, effects, stores, contexts)
- `type` for objects and unions and preferred over `interface`
- Files: kebab-case | Components: PascalCase

## UI & Styling

- Design mobile first
- Use **@kobalte/core** for interactions
- Tailwind v4 + project theme
- Use **CVA** for variants
- Include dark mode styles
- Add `data-component="name"` to UI components

## Data (Convex)

- Centralize queries/mutations in `src/core/hooks.ts`
- `createQuery` / `createMutation`
- Handle errors with try/catch
- Never throw during render

## Gotchas

- Not a Next.js app
- Tailwind v4 syntax
- Convex needs local dev server
