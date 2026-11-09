# Non-negotiables

Read this when you need the shared rules that hold for every change. `AGENTS.md` points here instead
of restating these rules.

- Humans own prod calls such as secrets, deploys, deletions, and scope. Agents ask before acting on
  them. Never print secret values. Prod here means Convex deploys, Cloudflare deploys, and any
  dashboard or token change.
- Stage exact paths when committing, never broad add. Use conventional commit format. See
  `AGENTS.md` for the exact shape used in this repo.
- No em dashes in prose. Code spans, commands, and flags keep their literal characters.
- Remove obsolete code. Add compatibility layers or migrations only for persisted data, public
  contracts, or an explicit requirement. Prefer the simplest solution that meets the current need.
- ADRs bind. When a change conflicts with a recorded decision, surface the conflict instead of
  silently overriding it.
- Docs restate nothing an owner holds. Point at the owner named in `sources-of-truth.md`.
