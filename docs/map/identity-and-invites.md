# Identity and invitations

Product terms: User, Invitation. Defined in `GLOSSARY.md`.

## Routes (`src/routes/`)

- `login.tsx` and `signup.tsx`: sign in outside the app shell.
- `_app/invite.$token.tsx`: invitation acceptance inside the shell.
- `_app/account.tsx` and `_app/you.tsx`: profile and own short list.
- `_app/route.tsx` plus `-components/session-gate.tsx`: shell level session gating. Guards are
  covered by `route-guards.integration.spec.ts`.

## UI (`src/features/account/`)

- `profile-card.tsx`: profile display and edit.

## Core (`src/core/`)

- `identity.ts`, `viewer.ts`: viewer and profile hooks.
- `session.ts`: session status; only a ready session authorizes.
- `groups.ts`: invite hooks `useCreateInvite`, `useAcceptInvite`, `useRevokeInvite`.

## Backend (`convex/`)

- `identity.ts`: `me`, `ensureProfile`, `rename`, `setAvatar`, `removeAvatar`, and `sessionUser`.
- `invites.ts`: `create`, `get`, `accept`, and `revoke`. Invitation links carry a bearer token and
  acceptance runs server side.
- `auth.ts`: Better Auth integration. Password plus emailed code; the invitation flow keeps invite
  context across auth and accepts idempotently. See `docs/architecture.md`.

## Data

- `convex/model/identity/schema.ts`: table `profiles`.
- `convex/model/groups/schema.ts`: table `invites`.

## Decisions

- `docs/adr/0005-auth-methods-invitation-flow.md`
- `docs/adr/0025-ready-session-and-degraded-identity.md`
- `docs/adr/0027-password-and-email-code-sign-in.md`

## Tests

- `src/core/identity.integration.spec.ts`, `profile.integration.spec.ts`,
  `auth.methods.integration.spec.ts`, `invites.integration.spec.ts`
- `login.integration.spec.ts`, `account.integration.spec.ts`, `you.integration.spec.ts`,
  `avatar-section.browser.spec.tsx`

## State

Shipped: password plus emailed code sign in, profiles with avatars, friend and group invitations
including single use friend links and reusable group links. Out of scope of the current code:
nothing in this area is missing for the MVP; the gaps sit in choice mechanics, see
[groups-and-shares.md](groups-and-shares.md) and [plans.md](plans.md).
