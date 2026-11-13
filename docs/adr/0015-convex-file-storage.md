# ADR-0015: Convex File Storage for application images

Date: 2026-11-05

Amended: 2026-11-13

Status: Accepted

## Context

Restaurant photos, avatars, group images, and meal photos need ownership, association, and
permission checks. Bearer-accessible file URLs authorize nobody, so possession of a URL can never
prove the right to see or attach the file.

## Decision

A signed-in client asks the backend for a short-lived upload URL and sends the raw blob straight to
Convex storage. Nothing is recorded at upload. Ownership is the first claim: the first signed-in
caller to attach an unclaimed storage ID, as an avatar or a restaurant image, owns it, and every
later claim of that ID is refused. Type and size come from the storage system record at claim time,
and attribution comes from the claiming caller. Dimension hints are client-reported and untrusted.
Display URLs resolve at render time. A daily job deletes blobs that nobody claimed within a day.
Rejected: a browser-facing upload endpoint that records an owner at upload (it needed its own CORS
allowlist and an ownership table that duplicated the claims), moving to object storage now (no need
for transforms or independent scaling yet), and raw URLs as authorization.

## Consequences

Ownership and associations live in documents, not in URL possession. Each claim holder is indexed by
storage ID so a claim check is one lookup per kind; restaurant images keep a separate claim record
until photos get their own table. Uploading needs no origin allowlist, because Convex storage
accepts the upload URL from any origin. An upload that is never attached costs storage for at most
about a day. Releasing an image or replacing an avatar leaves the blob unclaimed for the daily job.
Upload, claim, and cleanup paths need integration tests before production.

## Amendment 2026-11-13

Place photos now live in the `photos` table, indexed by storage ID. The interim separate claim
record is gone.
