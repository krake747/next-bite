# ADR-0015: Convex File Storage for application images

Date: 2026-11-05

Status: Accepted

## Context

Restaurant photos, avatars, group images, and meal photos need ownership, association, and
permission checks. Bearer-accessible file URLs authorize nobody, so possession of a URL can never
prove the right to see or attach the file.

## Decision

The client uploads the raw blob to an authenticated endpoint; the server stores it and records
server-observed metadata (owner, type, size), and callers attach storage IDs by reference. Display
URLs resolve at render time. Dimension hints are client-reported and untrusted: every trust decision
(ownership, association, type, size) comes from the server record, never from client claims.
Rejected: moving to object storage now (no need for transforms or independent scaling yet), and raw
URLs as authorization. Deferred: signed upload URLs.

## Consequences

Ownership and associations live in documents, not in URL possession. Attribution metadata is
denormalized onto entries at attach time from the server record; client-sent identity fields are
overwritten. Upload, validation, and cleanup paths need integration tests before production. The
browser-facing endpoint reflects only trusted origins; loopback stays trusted so local development
works with zero config, and a missing production allowlist breaks uploads loudly rather than
silently.
