# ADR-0003: Suspense-first data fetching

Date: 2026-11-07

Status: Accepted

## Context

Manual optional-data branching spreads gate, loading, and empty ternaries through every view and
nullable state through props. Suspense removes the branching, but a suspending query cannot
distinguish session states, and server rendering has no client to query through.

## Decision

Reads suspend under route-level Suspense boundaries with a route error component on each converted
route. Session states (signed-out, timed-out) stay explicit gates outside the boundaries, and server
rendering keeps queries disabled without a client. Rejected: keeping manual branches, and suspense
with a skip that returns undefined (it keeps the optionality the migration removes).

## Consequences

Converted views call suspense hooks unconditionally with no skip option. Route loaders warm the
cache fire-and-forget with swallowed errors, checking for a cached session first so signed-out
visits and server renders never fire doomed fetches; the Suspense view stays the source of truth and
refetches when the warm-up has not landed. The authenticated feed stays on live collections, not
Suspense; its conversion waits on those collections moving behind the api adapter.
