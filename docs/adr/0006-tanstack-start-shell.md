# ADR-0006: TanStack Start shell with SSR off

Date: 2026-11-05

Status: Superseded by ADR-0026

## Context

The app ran as a client-only SPA. Hosting it on a Worker needs a server entry point: a seam for
server rendering, server functions, and per-request work. The migration must not change what users
see.

## Decision

Adopt the Start shell with behavior identical to the SPA: no server functions, no server preloading,
subscriptions hydrating client-side as before. Rejected: staying on the plain router (no server seam
at all), and full SSR immediately (several render paths needed surgery first, so the shell lands the
framework without changing behavior).

## Consequences

The framework owns the client entry and renders the document shell. Routers build per request with a
per-request query client; sharing one client across requests would leak cached data between users.
Enabling SSR per route, adding server functions, and preloading queries are follow-ups, each with
its own ADR.
