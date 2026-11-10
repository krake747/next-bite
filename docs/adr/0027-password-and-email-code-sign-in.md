# ADR-0027: Password and email code sign-in

Date: 2026-11-10

Status: Accepted

## Context

Supersedes the sign-in method order in ADR-0005. Its invitation-first flow still holds.

ADR-0005 put social sign-in first, then emailed codes, with password as fallback. No social provider
was ever configured, and each one needs its own credentials and exact callback address per
environment, including every preview.

## Decision

Sign-in is password plus an emailed one-time code. The code method appears only where mail is
configured, so a contributor gets password sign-up with zero setup. Rejected: social providers, for
the per-environment setup above with little gain for an invite-driven app.

## Consequences

Previews and local development need no provider credentials. Adding a social provider later needs a
new record.
