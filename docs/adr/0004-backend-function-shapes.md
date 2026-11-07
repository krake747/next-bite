# ADR-0004: Backend function shapes

Date: 2026-11-06

Status: Accepted

## Context

Queries, mutations, and actions answered the same situations in different ways: missing rows, return
shapes, error prefixes, and verbs varied per domain, so callers memorized per-function behavior.
Public function names are the deployed API, so renames need delete-plus-create deploys and cannot be
done casually.

## Decision

Rule the shapes, migrate only what is free. Queries return null for missing or invisible rows, so
strangers learn nothing, not even existence. Mutations throw through shared guards. New mutations
return the affected document id; existing voids stay until a caller needs the id. Auth failures keep
the unauthorized prefix; new functions prefer create, update, remove, get, and list. Existing verbs
are grandfathered, not exemplary.

## Consequences

Shared auth guards live in one helpers module, never duplicated per domain. Reviewers check new
functions against the rules and reject new verbs outside the table without a note. Contract specs
keep asserting the documented shapes.
