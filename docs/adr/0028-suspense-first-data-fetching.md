# Suspense-first data fetching

Reads move from manual `data | undefined` branching to `useSuspenseQuery` under `<Suspense>`
boundaries, with a route-level error component on each converted route. Session states (signed-out,
timed-out) stay explicit gates outside the boundaries: a suspending query cannot distinguish them,
and SSR keeps queries disabled without a client.

**Considered Options**

- **Keep manual loading branches**: rejected. Every read repeats gate, loading, and empty ternaries,
  and nullable state spreads through props.
- **Suspense with skip-returning-undefined**: rejected. It keeps the `| undefined` the migration
  exists to remove.

**Consequences**

- `useSuspenseConvexQuery` lives in `src/core/convex-client.tsx` next to `useConvexQuery`, which
  stays for gated and optional reads until their views convert.
- Converted routes render gates first, then a `<Suspense>` boundary whose view calls suspense hooks
  unconditionally with no skip option.
- `useSuspenseConvexQuery` throws when no Convex client is connected; converted views must only
  mount below a ready session gate.
