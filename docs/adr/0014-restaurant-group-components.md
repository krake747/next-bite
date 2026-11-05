# Restaurant and group components, presentational only (Phase 4)

Phase 4 standardizes the restaurant card around three extracted pieces and adds the four greenfield
group components, all controlled and presentational with mock-data tests. No Convex changes, no
surface wiring: real interest data and feed assembly stay with the application work, per the Phase 3
reframing.

**Considered Options**

- **Parallel new components beside the old card**: Rejected. The spec forbids duplicated component
  implementations; the card is refactored to compose the new pieces, keeping one card with unchanged
  behavior and pixels.
- **Extract everything (notes, map, delete dialog)**: Rejected. Those are not in the Phase 4
  component list; they stay internal until a phase owns them.
- **Bind the interest button to localStorage or in-memory state**: Rejected. Fake persistence
  smuggled into production UI is worse than an honestly neutral button. The card renders it
  `wanted=false`, count `0`, noop toggle until Phase 5 binds real data.

**Consequences**

- `RestaurantHeader` (name, cuisine, menu pill, SocialMetadata attribution, location and hours box),
  `RestaurantGallery` (hero, cuisine fallback, action slot, count button, owns viewer state),
  `RestaurantInterestButton` (Tomato toggle, labeled, `aria-pressed`). `RestaurantCard` is a thin
  orchestrator; notes, map, rating, delete dialog untouched; skeleton and empty states untouched.
- `src/features/groups` (new `features-groups` fallow zone): `GroupMembers`, `GroupHeader` (cover,
  description, spot count), `SharedRestaurantList` (rows with optional select), `GroupCard`
  composing all three.
- Inline `fontFamily` styles in touched code become `font-display`/`font-sans` utilities.
- `restaurant.browser.spec.tsx` + `groups.browser.spec.tsx` cover header content, gallery viewer,
  interest toggle, group composition, and selection callbacks (13 tests).
- Deferred: real interest data, photo authorship, feed, `/design-system` route.
