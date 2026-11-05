# TanStack DB reactive collections

TanStack Query remains the data path today (ADR-0003). When Phase 3 starts, collections come from
TanStack DB with the Convex adapter (`@tanstack/db`, `@tanstack/react-db`,
`@tanstack/convex-db-collection`, all at 1.0.0-rc.1.3 at audit time). Convex stays the source of
truth; DB is a reactive client view for filtering, sorting, joins, and optimistic updates.

**Considered Options**

- **TanStack Query only**: Rejected as the long-term shape because local composition (filter, sort,
  join across collections) would be hand built per screen.
- **Convex React hooks directly**: Rejected because they couple each screen to subscription handling
  instead of a shared collection layer.
- **Second client database**: Rejected. DB persists nothing authoritatively; writes go through
  Convex mutations and backend authorization still enforces every rule.

**Consequences**

- Subscribe to scoped Convex queries only; never sync whole datasets to feed collections.
- Use collections where local composition pays off; keep direct queries where they do not.
- Optimistic handlers require success and failure paths; Convex mutations are the only persistence.
- Pin exact versions at Phase 3 start; the packages are still release candidates.
