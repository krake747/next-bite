# Bottom-up migration from SolidJS to React

KRA-44 requires migrating Next Bite from SolidJS to React. We chose a bottom-up, dependency-ordered
strategy (core → UI → features → routes) over a per-route incremental approach. Per-route
coexistence would require a framework bridge for shared state (auth, theme, Convex client) —
doubling the refactoring effort for a 50-file codebase. Bottom-up avoids shims entirely: each layer
is fully React before anything depends on it, and the KRA-45 E2E test suite validates the whole app
at the end.

**Considered Options**

- **Per-route incremental**: Migrate one route at a time, keeping SolidJS and React coexisting.
  Rejected because it requires a bridge layer for shared state and provides no incremental
  confidence (E2E tests only pass when everything works).
- **Bottom-up dependency order**: Rewrite from leaf dependencies upward. Chosen for clean dependency
  management and no shim overhead.

**Consequences**

- Long period with no visible output from `pnpm dev` until the final steps.
- TypeScript compilation is the intermediate feedback loop.
- Cannot split work between multiple developers (strictly sequential).
