# Groups and shares

Product terms: Group, Share. Defined in `GLOSSARY.md`.

## Routes (`src/routes/_app/`)

- `groups.tsx`: section layout.
- `groups.index.tsx`: group list.
- `groups.$groupId.tsx`: group detail with members, shares, invitations, and plans. Warms
  `api.groups.get` and `api.shares.listForGroup` in its loader.

## UI (`src/features/groups/`)

- `group-members.tsx`: member list.
- `share-to-group-dialog.tsx`: share a restaurant into a group.

## Core (`src/core/`)

- `groups.ts`: `useMyGroups`, `useRestaurantShares`, `useShareWithGroup`, `useUnshare`,
  `useCreateGroup`, and the invite hooks `useCreateInvite`, `useAcceptInvite`, `useRevokeInvite`.

## Backend (`convex/`)

- `groups.ts`: `create`, `leave`, `list`, and `get`. Membership helpers live in
  `convex/model/groups/` (`groups.ts`, `memberships.ts`).
- `shares.ts`: `shareWithGroup`, `unshare`, `listShares`, and `listForGroup`. Sharing requires
  restaurant ownership and group membership; duplicates for the same group return the existing
  share.
- `invites.ts`: `create`, `get`, `accept`, and `revoke`. Invitation records live in
  `convex/model/groups/invites.ts`.

## Data

- `convex/model/groups/schema.ts`: tables `groups`, `groupMembers`, and `invites`.
- `convex/model/places/schema.ts`: table `restaurantShares` for the share rows.

## Decisions

- `docs/adr/0007-group-owns-shared-list.md`
- `docs/adr/0005-auth-methods-invitation-flow.md`
- `docs/adr/0029-convex-modules-own-their-tables.md`

## Tests

- `src/routes/_app/groups.integration.spec.ts`
- `src/core/groups.integration.spec.ts`, `sharing.integration.spec.ts`,
  `invites.integration.spec.ts`
- `share-to-group-dialog.browser.spec.tsx`, `group-members.browser.spec.tsx`

## State

Shipped: create, list, detail, leave, share, unshare, and invitation links. Partial: the public
group functions are create, leave, list, and get; membership writes otherwise happen through
invitation acceptance in `convex/invites.ts`. Out of scope of the current code: group level choice
mechanics such as voting or a shortlist.
