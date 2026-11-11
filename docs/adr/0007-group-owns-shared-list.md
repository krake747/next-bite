# ADR-0007: Group owns the shared list

Date: 2026-11-06

Status: Accepted

## Context

A group is its shared collection. A parallel collections model split the product: every group list
needed a parallel collection, so two list models governed the same places.

## Decision

There is no separate collections entity. Membership plus group-to-place links govern access, and
listing a group's places reads through `groupPlaces`. Rejected: keeping independent collections
alongside groups, and migrating old rows (no shipped data depended on the old model, so it was
deleted with a clean preview and no migration).

## Consequences

Group lists render from the `groupPlaces` read, never from a second surface. Reads are member-only;
strangers are rejected. Feed and detail keep resolving through the shared visibility check.
