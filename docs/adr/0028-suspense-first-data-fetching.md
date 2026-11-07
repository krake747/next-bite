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

- `useSuspenseConvexQuery` lives in `src/api/convex-client.tsx` next to `useConvexQuery`, which
  stays for gated and optional reads until their views convert. Both build on the shared
  `convexQueryOptions` builder in `src/api/convex-options.ts`.
- Converted routes render gates first, then a `<Suspense>` boundary whose view calls suspense hooks
  unconditionally with no skip option.
- `useSuspenseConvexQuery` throws when no Convex client is connected; converted views must only
  mount below a ready session gate.
- Route loaders warm the cache with `queryClient.query(convexQueryOptions(...))`, fire-and-forget
  with swallowed errors. The loader checks `hasCachedSession()` first so signed-out visits and SSR
  never fire a doomed fetch; the Suspense view stays the source of truth and refetches on mount when
  the warm-up has not landed. Public queries (`restaurants.getById`, `landing.getStats`) warm
  ungated; `invite/$token` has no loader because its `now` arg makes the key un-warmable.
- The `/` authenticated feed stays on live collections (`useRestaurants`, `useFeedRestaurants` via
  react-db preload), not Suspense; only the signed-out landing stats suspend. Feed conversion waits
  on the domain-module slice moving those collections behind the api adapter.
