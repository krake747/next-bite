# Agent Guidelines

- This project is a side project web application built with SolidJS, TypeScript 6, Tailwind CSS v4,
  and our own Convex wrapper.
- This project uses `pnpm` as a package manager.
- We develop on WSL within Windows.
- We do not add comments, unless explicitly asked to do so.
- When we add comments we do not use em dashes. We use periods, commas, colons, or parentheses
  instead.
- Typesafety is paramount. Never cast types; fix at source instead.
- We prefer types over interfaces.
- Follow existing patterns
- When in planning mode and something is unclear, ask questions one at a time (like a quiz). Wait
  for each answer before asking the next question. Only after all questions are answered and you
  have no remaining uncertainties, present the final plan.

## Agent skills

### Issue tracker

Issues are tracked in Linear (project "next bite") via the official Linear MCP server. See
`docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles use the default label names. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` at repo root, ADRs under `docs/adr/`. See
`docs/agents/domain.md`.
