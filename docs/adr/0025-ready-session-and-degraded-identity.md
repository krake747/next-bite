# ADR-0025: Ready session and degraded identity

Date: 2026-11-10

Status: Accepted

## Context

Screens want to greet a returning user immediately, while backend work requires verified
authorization. Async auth operations overlap, late completions can land after sign out, and
subscriptions started before authorization is ready fail in ways that poison later reads. Disabled
reads still need a representation that never reaches the backend, and untrusted string identifiers
need a single place where they become typed references.

## Decision

Display identity never implies authorization. Only a ready session authorizes backend reads and
writes; everything else renders in a degraded or loading state that grants nothing.

Overlapping operations resolve by generation: the last starter owns pending state, errors, and
loading, and stale completions never resurrect a replaced or signed out session.

Conversions from untrusted to trusted happen at one boundary, never at call sites. Unready work
stays disabled with the data layer skip representation, never with placeholder arguments.

## Consequences

The interface can show a remembered user while staying signed out, with backend authorization
staying authoritative. Late bootstrap or sign in results cannot revive a previous account.
Collections stay scoped to one session and never leak rows across sign in or account change. The
price is explicit readiness gates on every backend read and write, plus review attention on any path
that introduces a new conversion or a new disabled state.
