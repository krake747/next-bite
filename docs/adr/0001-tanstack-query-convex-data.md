# ADR-0001: TanStack Query for Convex data fetching

Date: 2026-07-19

Status: Accepted

## Context

Backend state arrives over Convex subscriptions, but screens need more than fresh values: loading
and error states, a mutation lifecycle with optimistic updates, and shared subscriptions so repeated
reads of the same query do not multiply traffic. The question is whether to standardize on a
data-fetching library or bridge subscriptions into React by hand.

## Decision

Standardize on TanStack Query. A hand-rolled bridge was ruled out: it re-implements loading and
error handling per screen and provides no mutation lifecycle. The backend's own React hooks were
ruled out: they couple every screen to one backend's reactive pattern instead of a neutral data
layer. Accepted tradeoff: coarser reactivity than per-field signals; full-component re-renders are
acceptable for small, flat lists.

## Consequences

Every read gets loading, error, and data states plus cache deduplication for free. Mutation
lifecycle (pending flags, optimistic updates, invalidation) is uniform across the app. The cost is a
second reactive model alongside backend subscriptions, which must be kept in sync and released when
the last observer unmounts.
