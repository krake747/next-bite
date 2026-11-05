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

- `AvatarGroup` (4 visible + "+N" overflow, accessible label), `FriendPresence` (static dot with
  sr-only state), `SocialMetadata` (human sentences, null with no context), `ReactionBar` (like /
  comment / want toggles with counts, `aria-pressed`), `CommentList` (plain text, author-only
  delete, local draft form), `PhotoGallery` (3-up grid composing `LazyImage` + existing
  `ImageGalleryModal` viewer, per-photo attribution, add-photo entry), `ActivityPost` (author +
  time + text + restaurant + social context + reactions, representative data only).
- Bookmark is the Want-to-try toggle; no separate bookmark concept. `EmojiRating` untouched.
  `Avatar`'s static presence dot and `FriendPresence` stay display-only; no presence infra.
- `social.browser.spec.tsx` covers all seven (8 tests). `features-social` zone added to fallow
  boundaries.
- Deferred: Convex interests/likes/comments tables, photo `uploadedBy` attribution, feed assembly
  and homepage redesign (Phase 5), groups/plans (Phase 4), `/design-system` route (Phase 6).
