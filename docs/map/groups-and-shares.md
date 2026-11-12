# Groups and shares

Product terms: Group, Share. Defined in `GLOSSARY.md`.

## Routes (`src/routes/_app/`)

- `groups.tsx`: section layout.
- `groups.index.tsx`: group list.
- `groups.$groupId.tsx`: group detail with members, shared places, invitations, and plans. Warms
  `api.groups.get` and `api.places.forGroup` in its loader.

## UI (`src/features/groups/`)

- `group-members.tsx`: member list.
- `share-to-group-dialog.tsx`: share a restaurant into a group.

## Core (`src/core/`)

- `groups.ts`: `useMyGroups`, `useGroupPlaces`, `useAddToGroup`, `useRemoveFromGroup`,
  `useCreateGroup`, and the invite hooks `useCreateInvite`, `useAcceptInvite`, `useRevokeInvite`.

## Backend (`convex/`)

- `groups.ts`: `create`, `leave`, `list`, and `get`. Membership helpers live in
  `convex/model/groups/` (`groups.ts`, `memberships.ts`).
- `places.ts`: `addToGroup`, `removeFromGroup`, and `forGroup`. Group listing reads through
  `groupPlaces`; see `docs/adr/0007-group-owns-shared-list.md`.
- `invites.ts`: `create`, `get`, `accept`, and `revoke`. Invitation records live in
  `convex/model/groups/invites.ts`.

## Data

- `convex/model/groups/schema.ts`: tables `groups`, `groupMembers`, and `invites`.
- `convex/model/places/schema.ts`: table `groupPlaces` for the shared rows.

## Decisions

- `docs/adr/0007-group-owns-shared-list.md`
- `docs/adr/0005-auth-methods-invitation-flow.md`
- `docs/adr/0029-convex-modules-own-their-tables.md`

## Tests

- `src/core/groups.integration.spec.ts` and `src/core/invites.integration.spec.ts`.

## State

Shipped: create, list, detail, leave, and invitation links. Group places are added and removed
through `api.places.addToGroup`, `api.places.removeFromGroup`, and invitation acceptance in
`convex/invites.ts`. Out of scope of the current code: group level choice mechanics such as voting
or a shortlist.
