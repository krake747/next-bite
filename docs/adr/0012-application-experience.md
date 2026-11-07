# Application experience (Phase 5)

Phase 5 turns the component library into a social product: a minimal social backend, a feed-first
homepage, and a dedicated restaurant detail route. Reads stay public; every write requires sign-in,
enforced server-side via the Better Auth session.

**Considered Options**

- **Presentational redesign with mock data**: Rejected. A feed, counts, toggles, and comments
  without a data layer would be theater; the components were built to be bound.
- **Migrate existing data to user ids**: Rejected. `addedBy` stays a free-text friend name and old
  restaurants simply start at zero counts; no backfill, no user-table join.
- **Moderator/owner comment deletes**: Rejected. Only the author can delete, checked against the
  session user id in the mutation.

**Consequences**

- `convex/social.ts`: `interests` (one doc per user+restaurant, want/been toggle), `likes`,
  `comments` (plain text ≤500 chars, oldest-first); per-restaurant indexes; identity from
  `ctx.auth.getUserIdentity()`, display-name snapshot at write time.
- `src/core/social.ts`: structural input types (branded Convex ids stay at the boundary),
  `summarizeSocial`, `orderFeedByRecency`, `feedTextFor`, snapshot + mutation hooks.
- Homepage: activity feed (recency, notes as post text) on top, filtered grid below as Discover;
  header copy goes social. Cards bind counts + toggles + detail links (guests route to login). Feed
  posts link comments to the detail page.
- `/restaurants/$restaurantId`: gallery, header, interest + reactions, notes, interested friends,
  friends' photos, bound comments (author delete, sign-in prompt for guests), hours dialog,
  not-found and loading states.
- Homepage and detail page decomposed to satisfy the complexity gate (`useSocialActions`,
  `HomeFeed`, `HomeDiscover`, `DetailHero`, `DetailPhotos`, `DetailComments`).
- Verified with `pnpm check:full` (incl. pure aggregation tests) and `cf deploy --dry-run`.
  Live-write paths (toggle round-trips, comment add/delete incl. author-only refusal) need one
  manual pass against a deployed backend.
- Deferred: groups/plans pages, presence infra, `/design-system` route, comment editing, photo
  authorship, wheel weighting by interests.
