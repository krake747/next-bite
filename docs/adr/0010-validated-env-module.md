# ADR-0010: Validated env module owns all reads

Date: 2026-11-03

Status: Accepted

## Context

Direct environment reads with hand-written presence checks at each call site meant every site
re-decided what missing means, and a missing key surfaced far from its cause.

## Decision

A single validated module parses once at import: required values fail fast, malformed values fail
loudly instead of degrading at runtime. All call sites read from it. Rejected: keeping direct reads.

## Consequences

Adding a variable means extending the schema plus its spec, not scattering reads. Test projects
carry dummy values so the module import never throws under test.
