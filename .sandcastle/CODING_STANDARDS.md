# Coding Standards

## Style

- Use `pnpm` as the package manager. Never `npm` or `yarn`.
- Types over interfaces. Never cast types; fix at source instead.
- Do not add comments unless explicitly asked.
- When comments are needed, do not use em dashes. Use periods, commas, or colons instead.
- Follow existing patterns in the codebase for component structure, file naming, and module
  organization.
- Use SolidJS primitives (`createSignal`, `createResource`, `createEffect`) idiomatically.
- Reactive state belongs in signals; derived state belongs in `createMemo`.

## Convex

- Convex functions live under `convex/`. Exported functions are automatically API endpoints.
- Use `query` for reads, `mutation` for writes, `action` for external API calls.
- Schema lives in `convex/schema.ts`. Use `defineSchema` and `defineTable`.

## Testing

- Tests live alongside source files with `.test.ts` or `.test.tsx` extension.
- Use descriptive test names that explain the expected behavior.
- Prefer integration-style tests over shallow unit tests where practical.

## Commits

- `[RALPH]` prefix on commits produced by Sandcastle automation.
- Keep commits focused — one concern per commit.
- Messages should explain what and why, not how.

## Architecture

- Components should be focused on a single responsibility.
- Prefer composition over inheritance.
- Shared utilities belong in `src/lib/`.
- Follow existing module boundaries and avoid cross-cutting imports between unrelated domains.
