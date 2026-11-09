# ADR-0022: Design-system documentation and distribution

Date: 2026-11-05

Status: Accepted

## Context

The system must stay self-describing: living examples, agent rules, and distributable metadata.
Nothing is published to an external registry; components get consumed here first.

## Decision

A dev-only route renders the real components with representative mock data; agent rules live in repo
docs; a registry file describes what would ship. Rejected: screenshots or duplicated demo components
(every example renders the actual component), and publishing to a registry now (the registry
describes source that is stable and proven here, not a release).

## Consequences

Interactive elements in the gallery stay live. The route stays dev-only and redirects in production.
No automated test asserts on the docs page itself; verification is a manual visual read plus the
full gate. Remaining after this record: production deploy and the manual verification pass over
write paths, detail, maps, and the visual read.
