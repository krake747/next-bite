# ADR-0017: TanStack AI as an optional extension

Date: 2026-11-05

Status: Accepted

## Context

Discovery, sharing, groups, and planning must work without any model. AI arrives later as an
extension, and when it does, model keys must stay server side while consequential actions stay
gated.

## Decision

The core app stays useful with no AI. AI arrives behind server routes with typed tools,
backend-enforced authorization, approval for consequential actions, and usage limits; UI, config,
streaming routes, and persistence each get their own layer. Rejected: AI as a core dependency,
direct client-to-provider calls, and unrestricted tool access.

## Consequences

Provider config installs at extension start; conversations persist. Failures degrade to the non-AI
product, never to a broken app. Every new tool ships with its authorization test.
