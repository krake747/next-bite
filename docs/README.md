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
- Decisions: [ADRs](adr/0001-tanstack-query-convex-data.md). Read the catalog below before changing
  an established area; when a change conflicts with a recorded decision, surface the conflict
  instead of silently overriding it. Catalog is ordered by architectural impact, highest first.
- Data model: [migrations](../migrations.md).
- Technical foundation: [tech](tech.md). Points at owners for stack, layers, rendering, data, auth,
  storage, email, AI, testing, plus the dependency audit.

## ADRs

- [0001](adr/0001-tanstack-query-convex-data.md): TanStack Query for Convex data fetching.
- [0002](adr/0002-tanstack-db-collections.md): TanStack DB collections over Convex.
- [0003](adr/0003-suspense-first-data-fetching.md): Suspense-first data fetching.
- [0004](adr/0004-backend-function-shapes.md): backend function shapes, nulls, guards, verbs.
- [0005](adr/0005-auth-methods-invitation-flow.md): Google OAuth, email OTP, invitation-first flow.
- [0006](adr/0006-tanstack-start-shell.md): TanStack Start shell with SSR off.
- [0007](adr/0007-group-owns-shared-list.md): group owns the shared list, no separate entity.
- [0008](adr/0008-vite-plus-toolchain.md): Vite+ toolchain with co-located config.
- [0009](adr/0009-react-compiler-owns-memoization.md): React Compiler owns memoization.
- [0010](adr/0010-validated-env-module.md): validated env module owns all reads.
- [0011](adr/0011-tiered-vitest-projects.md): tiered Vitest projects on happy-dom.
- [0012](adr/0012-testing-standards.md): testing standards, black-box specs, no tautological tests,
  third-party libraries assumed correct.
- [0013](adr/0013-cloudflare-workers-assets.md): Cloudflare Workers static assets via the cf CLI.
- [0014](adr/0014-manual-release-pipeline.md): manual release pipeline with semver tags.
- [0015](adr/0015-convex-file-storage.md): Convex File Storage for images.
- [0016](adr/0016-mailgun-eu-email.md): Mailgun EU transactional email.
- [0017](adr/0017-tanstack-ai-extension.md): TanStack AI as optional extension.
- [0018](adr/0018-base-ui-headless-primitives.md): Base UI headless primitives.
- [0019](adr/0019-design-system-foundation.md): design system foundation (light-only Tomato and
  Butter).
- [0020](adr/0020-core-ui-standardization.md): core UI standardization (eleven primitives, one
  contract).
- [0021](adr/0021-cva-axis-naming.md): CVA axis naming, tone is color, variant is structure.
- [0022](adr/0022-design-system-docs.md): design-system documentation and distribution.
- [0023](adr/0023-application-experience.md): application experience (feed, detail, social backend).
