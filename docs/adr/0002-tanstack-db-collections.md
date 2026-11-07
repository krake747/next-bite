# ADR-0002: TanStack DB reactive collections

Date: 2026-11-05

Status: Accepted

## Context

Some screens compose data locally: filtering, sorting, joining lists, optimistic updates.
Hand-building that per screen duplicates logic, while syncing whole datasets to feed it wastes
bandwidth. At the same time, small single-record reads gain nothing from a synced collection.

## Decision

The backend stays the source of truth; TanStack DB is a reactive client view for screens where local
composition pays off, scoped to one signed-in session. Small single-record reads stay direct
queries: that is the narrow exception to the prefer-collections rule. Writes go only through backend
mutations; the client never persists authoritatively. Optimistic inserts carry a client mutation key
the backend dedupes, and the client resolves temp rows to synced server records by key, never
navigating to or mutating against fabricated ids.

## Consequences

List screens filter, sort, and join locally with optimistic updates. The session contract is the
price: collections are scoped per session, sign-out or account change abandons the previous
session's synced rows, mid-session sync failures recover edge-triggered with re-verified auth rather
than full reloads, and subscriptions never start before auth is ready (an early subscribe errors the
sync and poisons the collection). If the timing or recovery discipline slips, the collection layer
fails silently, so it gets review attention proportional to its subtlety.
