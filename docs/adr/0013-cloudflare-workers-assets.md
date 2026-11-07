# ADR-0013: Cloudflare Workers static assets

Date: 2026-11-03

Status: Accepted

## Context

Hosting needs a single-page-application fallback and a path off the previous host toward the
project-standard platform. The question is which runtime shape and which CLI owns it.

## Decision

Host as an asset-only Worker with single-page-application fallback, driven by the dedicated CLI with
typed config; the previous vendor files are gone. Rejected: staying on the previous host, Pages (in
maintenance), and the bundler CLI (the chosen CLI is the single tool for project, account, and
resource tasks, and the typed config gives editors autocomplete).

## Consequences

Deploys build with the toolchain, then upload the bundle as Worker assets. Build-time values bake in
at build time; no Worker secrets or bindings are needed since the backend lives elsewhere. Deploying
needs interactive login or a token in automation. The CLI cannot stream live logs yet, so tailing
goes through the legacy tool for now. Observability stays off.
