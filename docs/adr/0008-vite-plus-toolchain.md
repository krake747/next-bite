# ADR-0008: Vite+ toolchain with co-located config

Date: 2026-11-03

Status: Accepted

## Context

Formatter and linter config scattered across dotfiles, no push gate, and a compiler bridge in the
build. The reference setup tracks a single toolchain owner with config in one place.

## Decision

Adopt the Vite+ toolchain: formatter and linter config co-located with the test projects, the native
compiler path, and conventional commits enforced in the commit hook. Rejected: staying on the
vanilla setup, which keeps the compiler bridge and the scattered config.

## Consequences

One toolchain owner for dev, build, format, lint, and test. Tiered gates run everyday checks
locally, architecture checks before structural pushes, and the full suite in CI; the pre-push hook
runs the everyday gate. Version history stays out of the manifest: tags plus releases own it.
