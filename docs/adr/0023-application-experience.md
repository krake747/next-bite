# ADR-0023: Application experience

Date: 2026-11-05

Status: Accepted

## Context

The component library must become a social product: a minimal social backend, a feed-first homepage,
and a dedicated restaurant detail route. Reads stay public; every write requires sign-in, enforced
server side.

## Decision

A minimal social backend (per-user-per-restaurant interest toggles, likes, short oldest-first
plain-text comments, per-restaurant indexes, identity from the session, display-name snapshot at
write time); a homepage with the activity feed on top and the filtered grid below as Discover; and a
detail route binding gallery, reactions, notes, interested friends, photos, and comments. Rejected:
a presentational redesign with mock data (theater without a data layer; the components were built to
be bound), migrating existing rows to user ids (old rows start at zero counts), and moderator or
owner comment deletes (author-only, checked against the session user).

## Consequences

Homepage and detail decompose to satisfy the complexity gate. Live-write paths (toggle round-trips,
comment add and delete including author-only refusal) need one manual pass against a deployed
backend. Deferred: groups and plans pages, presence, comment editing, photo authorship, and wheel
weighting by interests.
