# ADR-0016: Mailgun EU for transactional email

Date: 2026-11-05

Status: Accepted

## Context

One-time codes, verification, invitations, and notifications need a server-side sender with an EU
data-processing posture, shared by the auth callbacks and the invite flows through one seam.

## Decision

Send through the EU-region HTTPS API from server-side code only, behind a small provider interface.
The sender domain is a proposal until DNS and setup confirm it. Rejected: client-side sending
(credentials stay in server secrets), the SDK dependency (plain HTTPS keeps the surface small; adopt
it only if retry, batch, or webhook needs justify it), and non-EU regions by default.

## Consequences

No email credentials in client bundles; server functions own the send path. Free-tier limits and
processing terms need verification before launch. Invitation emails carry signed tokens that the
acceptance mutation validates.
