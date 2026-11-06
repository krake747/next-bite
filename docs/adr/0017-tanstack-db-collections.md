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

## Settled split and session contract

- Collections back the owner and feed restaurant lists. Single-record detail (`getById`), social
  summaries, friendships, and landing stats stay direct TanStack Query reads: they are small, fresh
  single-record or public-SSR reads where a synced collection buys nothing. This is the narrowly
  scoped exception to "client path prefers DB", recorded here for Kevin.
- Collections are scoped to one signed-in session (`getSessionCollections` slots per session key). A
  sign-out or account change abandons the previous session's synced rows, and user-scoped Query
  entries (`restaurants:*`, `friendships:*`, `social:*`) are removed alongside. Shared entries
  (`landing:*`, `auth:*`) survive. Abandoned collections release with their last live query rather
  than through explicit disposal, which refuses while mounted. Convex-auth readiness means the
  better-auth session resolved with a user; Convex token arrival follows within the same tick and
  subscriptions self-heal, so no separate token probe gates reads.
- Inserts carry a persisted client mutation key. The backend dedupes retries inside the insert
  mutation and stores the key on the document; the client resolves the temp row to the synced server
  id by key and never navigates to or mutates against fabricated `optimistic-*` ids. Direct writes
  refuse temp ids. If resolution times out, the row may still exist server-side: check the list
  before resubmitting rather than retrying blindly.
