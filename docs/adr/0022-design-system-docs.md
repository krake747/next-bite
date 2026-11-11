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
Docs pages render real components, so browser specs and registry sync specs may assert on them;
manual visual read remains the release check alongside the full gate.

## Amendment 2026-11-11

The original ban on docs page tests blocked sync specs that keep the gallery honest. Browser specs
and registry checks for /ds are allowed because docs point at code and pages render real components.
Unit snapshots of docs copy stay out; behavior and sync stay in.
