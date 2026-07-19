# Coding Standards

## Style

- Use `pnpm` as the package manager. Never `npm` or `yarn`.
- Types over interfaces. Never cast types; fix at source instead.
- Do not add comments unless explicitly asked.
- When comments are needed, do not use em dashes. Use periods, commas, or colons instead.
- Follow existing patterns in the codebase for component structure, file naming, and module
  organization.
- Use React hooks idiomatically. State belongs in `useState`; derived values compute inline.
- Use TanStack Query for server state (`useQuery`, `useMutation`). Never fetch in effects.
- Use Base UI primitives for interactive components (Dialog, Popover, Menu).

## Convex

- Convex functions live under `convex/`. Exported functions are automatically API endpoints.
- Use `query` for reads, `mutation` for writes, `action` for external API calls.
- Schema lives in `convex/schema.ts`. Use `defineSchema` and `defineTable`.

## Testing

- Unit tests (`*.test.ts`) live alongside source files, running in node via Vitest.
- Browser tests (`*.test.tsx`) render with @testing-library/react in jsdom via Vitest.
- E2E tests live in `e2e/` and run with Playwright against the dev server.
- Use descriptive test names that explain the expected behavior.
- Query components by text content or `data-slot` attributes, not CSS classes.

## Commits

- `[RALPH]` prefix on commits produced by Sandcastle automation.
- Keep commits focused — one concern per commit.
- Messages should explain what and why, not how.

## Architecture

- Components should be focused on a single responsibility.
- Prefer composition over inheritance.
- Shared utilities belong in `src/core/`.
- Follow existing module boundaries and avoid cross-cutting imports between unrelated domains.
