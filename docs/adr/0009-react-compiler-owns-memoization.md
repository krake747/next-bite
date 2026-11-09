# ADR-0009: React Compiler owns memoization

Date: 2026-11-03

Status: Accepted

## Context

Hand memoization litters components with dependency arrays. Each array is a promise the author
renews on every edit, and a stale one fails silently at runtime. Reviews then argue about caching
instead of behavior. The compiler settles the whole category at build time: it proves what to cache,
so authors stop guessing.

## Decision

The compiler owns memoization. Components stay plain and declarative with no manual cache calls. We
ruled out memo by default: dependency arrays rot, and review time spent on caching is time stolen
from behavior. We ruled out the Babel compiler preset: the native path is faster and removes the
bridge from the build.

## Consequences

Render performance stops depending on author discipline. There are no dependency arrays to forget.
The tradeoff: the codebase must stay compilable, so the compiler lint rules run as errors and
conflicting patterns get rewritten rather than suppressed.
