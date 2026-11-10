# ADR-0028: Friends see every save

Date: 2026-11-11

Status: Accepted

## Context

The MVP loop is: save a place, friends see it, mark want or been, add it to a group, plan there.
Per-person shares, likes, comments, visit memories and ratings added surfaces and a per-item share
check without serving that loop. Supersedes in part ADR-0023 (likes and comments).

## Decision

Accepted friendship grants access to everything a user saves; group membership grants access to the
places added to that group. There is no sharing with one person. Want and been are the only
reactions. Rejected: explicit per-item sharing (a share check on every read and a dialog step on
every save), and keeping likes beside want (two signals for one intent). Comments and visit memories
are deferred, not ruled out, and return as their own module.

## Consequences

Visibility is one bounded check: owner, accepted friend, or member of a group holding the place.
Unfriending revokes access at once. A user who wants a place private keeps it out of their saves
until a private flag is decided.
