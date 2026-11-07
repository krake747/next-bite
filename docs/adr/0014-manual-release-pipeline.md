# ADR-0014: Manual release pipeline with semver tags

Date: 2026-11-03

Status: Accepted

## Context

Deploys stamp public URLs and bake production environment, so they stay a deliberate act until the
line stabilizes. Releases still need explicit versioning, a gate per release, and one-click dry
runs.

## Decision

Manual dispatch with patch, minor, or major computing the next tag from the latest tag. Dispatch
waits for CI green on the dispatched commit, then builds, deploys, tags, and publishes a release; a
dry run builds without tagging or releasing. Rejected: release on every push.

## Consequences

Tags plus releases own the version history; nothing deploys automatically. The pipeline needs
platform, account, and app-environment secrets. Runs only when dispatched.
