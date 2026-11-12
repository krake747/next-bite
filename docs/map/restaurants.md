# Restaurants

Product terms: Restaurant, Save, Cuisine, Location, Opening Hours. Defined in `GLOSSARY.md`.

## Routes (`src/routes/_app/`)

- `home.tsx`: river of own restaurants plus friends restaurants, composed from `RestaurantCard` and
  `ActivityPost`.
- `add.tsx`: creation entry.
- `restaurants.$restaurantId.tsx`: detail view with gallery, live opening hours, and interest
  buttons.

## UI (`src/features/restaurants/`)

- `restaurant-form.tsx`, `restaurant-form-fields.tsx`: create and edit.
- `restaurant-list.tsx`, `restaurant-card.tsx`: list and card.
- `restaurant-header.tsx`, `restaurant-gallery.tsx`: detail header and photos.
- `opening-hours.tsx`, `opening-hours-dialog.tsx`, `opening-hours-utils.ts`: schedule display.
- `cuisine-suggestion.ts`: free text cuisine help.
- `restaurant-interest-button.tsx`: Want and Been toggles.
- `restaurant-card-map.tsx`, `use-restaurant-images.ts`: map preview and image handling.
- `empty-restaurants-state.tsx`: empty state.

## Core (`src/core/`)

- `restaurants.ts`: list, feed, and detail hooks plus the preload helpers used by route loaders.
- `saves.ts`: Want and Been summaries, counts, and recency ordering.
- Env reads only through `env.ts` (`src/core/env.ts`).

## Backend (`convex/`)

- `places.ts`: `create`, `mine`, `feed`, and `get` queries; `setSave`, `addToGroup`, and
  `removeFromGroup` mutations; `forGroup` query; `hours` action. Visibility for owner, friends, and
  group members is `canViewPlace` in `convex/model/places/places.ts`.
- `storage.ts`: `generateUploadUrl` plus claim cleanup for place photos and avatars.

## Data (`convex/model/places/schema.ts`)

Tables `places`, `photos`, `saves`, `groupPlaces`, and `clientMutations`. Fragments compose in
`convex/schema.ts`.

## Decisions

- `docs/adr/0007-group-owns-shared-list.md`
- `docs/adr/0028-friends-see-saves.md`
- `docs/adr/0015-convex-file-storage.md`
- `docs/architecture.md`: data flow and auth sections

## Tests

- `src/features/restaurants/restaurant-form.browser.spec.tsx` for the form; pure specs for cuisine
  suggestion and opening hours utils.
- `src/core/places.integration.spec.ts` and `src/core/feed.integration.spec.ts`; home feed coverage
  in `src/routes/home-feed.integration.spec.tsx`.

## State

Shipped: create, edit, delete, detail, list, feed, opening hours, images, Want and Been. Partial:
discovery is ordered by recency with no ranking beyond what the code shows. Out of scope of the
current code: picking one restaurant for the group. Shares pool candidates; nothing in the code
selects a winner. Plans cover dates; see [plans.md](plans.md).
