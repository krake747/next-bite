# ADR-0011: Tiered Vitest projects

Date: 2026-11-03

Status: Accepted

## Context

All tests shared one flat project with one environment and one setup file, which hid which tests
need a DOM and gave HTTP-touching specs no boundary control.

## Decision

Filename-suffix tiers backed by per-tier projects with per-tier timeouts and an HTTP-boundary seam:
pure logic runs without a DOM and stays fast, the rest run against a lightweight DOM. Rejected: flat
names on a single DOM project, where timeouts live in spec files and network access has no choke
point.

## Consequences

Scope follows the filename, and each tier runs independently. Timeouts live in config, not in spec
files. The browser tier is the seam for a real-browser runner later. The HTTP seam starts with
unexpected network access failing loudly, so specs declare the traffic they touch.
