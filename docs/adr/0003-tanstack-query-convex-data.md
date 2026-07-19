# TanStack Query for Convex data fetching

The SolidJS app used a custom `convex-solid.ts` wrapper (35 lines) bridging Convex's `onUpdate`
callbacks into SolidJS signals. For React, we chose TanStack Query over porting the thin wrapper.
TanStack Query provides standardized loading/error/data states, mutation lifecycle management
(isPending, onSuccess, optimistic updates, cache invalidation), and cache deduplication — multiple
consumers of the same Convex query share one subscription. The trade-off is losing SolidJS-style
fine-grained reactivity per field, but the app's data shape (small, flat restaurant/friend lists)
makes full-component re-renders acceptable.

**Considered Options**

- **Port the thin wrapper**: Use `useSyncExternalStore` to bridge Convex subscriptions into React
  state. Rejected because it requires manual handling of loading/error states and provides no
  mutation lifecycle.
- **Convex's own React hooks (`convex/react`)**: Rejected because they would couple the app to
  Convex's specific reactive pattern rather than a standardized data-fetching layer.

**Consequences**

- Additional dependency: `@tanstack/react-query` (~24KB gzipped, already in the TanStack ecosystem
  via Router).
- Convex subscription ref-counting needed to clean up when the last observer unmounts.
