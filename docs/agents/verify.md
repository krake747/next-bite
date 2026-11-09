# Verify behavior

Read this when the task needs behavior proof from driven routes or specs. It names which surface
owns the drive. Load only what it points to.

| Change                           | Read first                             | Then only as needed               |
| -------------------------------- | -------------------------------------- | --------------------------------- |
| Pure logic in `src/core/`        | `docs/agents/testing.md` (pure)        | Co-located `*.pure.spec.ts`       |
| Hooks and isolated UI            | `docs/agents/testing.md` (unit)        | Co-located `*.spec.{ts,tsx}`      |
| Full interaction components      | `docs/agents/testing.md` (browser)     | Co-located `*.browser.spec.tsx`   |
| Route-level or backend contract  | `docs/agents/testing.md` (integration) | Real `routeTree`, Convex contract |
| Convex schema or function change | `convex/_generated/ai/guidelines.md`   | `docs/migrations.md`              |

## Rules

Follow the named tier for launch, drive, evidence, and cleanup. Do not restate its commands here.

Keep status plus failing and passing runs per check. Evidence survives cleanup: paste runs verbatim
into the ticket or PR.

Stop only instances this run started. Never use broad kills.

Secrets come from `.env.local` (local) or the shell export of `.env.production.local` (deploy).
Never invent values and never print them.
