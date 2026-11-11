# Map

Agent entry point for the Next Bite product surface. Each page links a product concept to the code
that owns it. Product language lives in `GLOSSARY.md`; behavior lives in the linked code.

## How to use this folder

1. Start here for the area list.
2. Open the area page for pointers: routes, UI, core hooks, Convex functions, tables, decisions,
   tests.
3. Read the linked code for behavior. Pointers can go stale; code wins.
4. Name concepts with `GLOSSARY.md` terms, never the synonyms it avoids.

## Freshness rules

These bind per `AGENTS.md`:

- Pointers only. Values, counts, versions, and config live in the linked files.
- No plans here. Proposals and progress live in the ticket or the PR.
- When code moves, update the pointer in the same change that moves it.

## Areas

| Area                     | Page                                               | Product terms                                      |
| ------------------------ | -------------------------------------------------- | -------------------------------------------------- |
| Restaurants              | [restaurants.md](restaurants.md)                   | Restaurant, Save, Cuisine, Location, Opening Hours |
| Groups and shares        | [groups-and-shares.md](groups-and-shares.md)       | Group, Share                                       |
| Plans                    | [plans.md](plans.md)                               | Plan                                               |
| Friends and social       | [friends-and-social.md](friends-and-social.md)     | Friend, Friend update, Want, Been                  |
| Identity and invitations | [identity-and-invites.md](identity-and-invites.md) | User, Invitation                                   |

## Status labels

Each page marks code as Shipped (present and covered by tests), Partial (present but thin), or out
of scope of the current code (absent, stated factually). Out of scope is a statement about the code,
not a proposal.
