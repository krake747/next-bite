# Technical documentation

Long-lived explanations of this project's architecture and technical decisions.

- Start at [Next Bite](../GLOSSARY.md) for domain language.
- Agent guides: [non-negotiables](agents/non-negotiables.md), [CI gate](agents/ci-gate.md),
  [issue tracker](agents/issue-tracker.md), [ticket anatomy](agents/ticket-anatomy.md) plus
  [templates](agents/templates/parent.md), [tracker map](agents/tracker-map.md),
  [triage labels](agents/triage-labels.md), [agent contract](agents/agent-contract.md),
  [worktrees](agents/worktrees.md), [stacked PRs](agents/stacked-prs.md),
  [domain layout](agents/domain.md), [verify](agents/verify.md), [toolchain](agents/toolchain.md),
  [testing](agents/testing.md), and [sources of truth](agents/sources-of-truth.md).
- Decisions: [ADRs](adr/README.md). Read the record for the area you are changing before changing
  it; when a change conflicts with a recorded decision, surface the conflict instead of silently
  overriding it. The directory listing is the index, ordered by architectural impact.
- Data model: [migrations](../migrations.md).
- Environments and release: [environments](environments.md). Production, local, and preview
  backends, release order, and the secrets each environment holds.
- Technical foundation: [tech](tech.md). Points at owners for stack, layers, rendering, data, auth,
  storage, email, AI, and testing.

## ADRs

The directory listing is the index. Read the record for the area you are changing before you change
it.
