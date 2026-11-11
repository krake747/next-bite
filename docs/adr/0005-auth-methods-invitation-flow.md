# ADR-0005: Auth methods and invitation-first flow

Date: 2026-11-05

Status: Superseded in part by ADR-0027. Amended by #196: invites are `invites` rows with token,
createdBy, target and expiresAt; revoke deletes the row and expiry is a read-time comparison, so a
revoked or missing link reads as not found. Acceptance stays a single atomic mutation.

## Context

Invites must survive auth redirects, missing profile fields get collected after auth, and acceptance
must be idempotent. Above all, backend identity must never come from client claims: a client session
alone never implies backend auth readiness.

## Decision

Password stays as fallback, not the primary path: invites convert better with OAuth first, then
email OTP. Invite context persists across the auth round trip and validates server side on accept;
acceptance lives in a single mutation so retries are safe. Backend functions derive the user from
authenticated context, never from client-provided ids. Client-resolved identity was ruled out for
exactly that reason, as was keeping invite state client-side only (redirects drop it).

## Consequences

One centrally configured auth client with the official backend integration. Trusted origins and
redirects are validated. Invitation acceptance is retry-safe, and every backend rule keeps enforcing
against the authenticated user.
