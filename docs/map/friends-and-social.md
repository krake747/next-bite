# Friends and social

Product terms: Friend, Friend update, Want, Been. Defined in `GLOSSARY.md`.

## Routes (`src/routes/_app/`)

- `friends.tsx`: friend list, pending requests, and request by email. Warms `api.social.friends` and
  `api.social.requests` in its loader.
- `home.tsx`: river of own restaurants plus Latest from friends, rendered through `ActivityPost`.
- `restaurants.$restaurantId.tsx`: per restaurant Want and Been buttons and summaries.

## UI (`src/features/social/`)

- `activity-post.tsx`: a friend shared restaurant as shown in the home river.
- `reaction-bar.tsx`: Want toggle on a friend update.

## Core (`src/core/`)

- `social.ts`: `useFriends`, `useFriendRequests`, `useAcceptFriend`, `useRemoveFriend`, and
  `useRequestFriendByEmail`.
- `saves.ts`: per restaurant social summaries, counts, and feed ordering.

## Backend (`convex/`)

- `social.ts`: `friends`, `requests`, `requestByEmail`, `accept`, and `remove`. One row per
  direction; accepting writes both rows.
- `places.ts`: `setSave` for Want and Been; summaries read through `saves`.
- `convex/model/social/friendships.ts`: friendship helpers and the file that owns the friend and
  request limits.

## Data

- `convex/model/social/schema.ts`: table `friendships`.
- `convex/model/places/schema.ts`: table `saves` for Want and Been rows.

## Decisions

- `docs/adr/0028-friends-see-saves.md`
- `docs/architecture.md`: auth section on the one row per direction friendship shape

## Tests

- `src/core/social.integration.spec.ts` and `src/routes/home-feed.integration.spec.tsx`.

## State

Shipped: friend requests by email, accept, remove, friend list, friend river, Want and Been with
counts. Partial: social proof is counts plus activity posts; there is no comment thread shape in the
code. Out of scope of the current code: turning Want counts into a group pick.
