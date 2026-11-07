# Social components, presentational only (Phase 3)

Phase 3 builds the seven social primitives as controlled, presentational components in
`src/features/social`, verified with representative mock data. No Convex changes, no surface wiring:
the backend tables and feed assembly discussed mid-scoping are new features, not design-system
setup, and stay with the later application work.

**Considered Options**

- **Include the minimal backend (interests, likes, comments)**: Rejected for now. Real toggles need
  identity, authorization, and migrations — a feature phase, not a component phase. The components
  take data via props and emit actions via callbacks, so binding them later changes no component
  API.
- **Wire into restaurant card/detail for live verification**: Rejected for the same reason. Wiring
  is integration work; the browser-tier suite with mock data proves the components render and
  behave.

**Consequences**

- `AvatarGroup` (4 visible + "+N" overflow, accessible label) and `SocialMetadata` (human sentences,
  null with no context) live in `src/pattern/` as composable patterns, imported by `ActivityPost`
  and `CommentList`; the remaining five (`FriendPresence`, `ReactionBar`, `CommentList`,
  `PhotoGallery`, `ActivityPost`) live in `src/features/social`. Later additions in the same area
  (`friends-filter.tsx`, `visit-memories.tsx` with real `Id<"restaurants">` bindings) came from
  application phases, not Phase 3.
- Bookmark is the Want-to-try toggle; no separate bookmark concept. `EmojiRating` untouched.
  `Avatar`'s static presence dot and `FriendPresence` stay display-only; no presence infra.
- `social.browser.spec.tsx` covers all seven (8 tests). No per-feature `features-social` fallow zone
  was added; the generic `features` zone (which forbids `features` importing `features`) covers the
  boundary.
- Deferred: Convex interests/likes/comments tables, photo `uploadedBy` attribution, feed assembly
  and homepage redesign (Phase 5), groups/plans (Phase 4), `/ds` route (Phase 6, landed as
  `src/routes/ds/`, dev-only).
