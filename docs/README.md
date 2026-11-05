# Technical documentation

Long-lived explanations of this project's architecture and technical decisions.

- Start at [Next Bite](../GLOSSARY.md) for domain language. The map of glossaries lives in
  [GLOSSARY-MAP](../GLOSSARY-MAP.md).
- Guides: [toolchain](agents/toolchain.md) and [testing](agents/testing.md), plus agent guides for
  the [issue tracker](agents/issue-tracker.md), [triage labels](agents/triage-labels.md), and
  [domain layout](agents/domain.md).
- Decisions: [ADRs](adr/0001-bottom-up-migration-solidjs-to-react.md). Read the catalog below before
  changing an established area; when a change conflicts with a recorded decision, surface the
  conflict instead of silently overriding it.
- Data model: [migrations](../migrations.md).

## ADRs

- [0001](adr/0001-bottom-up-migration-solidjs-to-react.md): bottom-up SolidJS to React migration.
- [0002](adr/0002-base-ui-headless-primitives.md): Base UI headless primitives.
- [0003](adr/0003-tanstack-query-convex-data.md): TanStack Query for Convex data fetching.
- [0004](adr/0004-vite-plus-toolchain.md): Vite+ toolchain with co-located config.
- [0005](adr/0005-tiered-vitest-projects.md): tiered Vitest projects on happy-dom.
- [0006](adr/0006-validated-env-module.md): validated env module owns all reads.
- [0007](adr/0007-react-compiler-owns-memoization.md): React Compiler owns memoization.
- [0008](adr/0008-cloudflare-workers-assets.md): Cloudflare Workers static assets via the cf CLI.
- [0009](adr/0009-manual-release-pipeline.md): manual release pipeline with semver tags.
- [0010](adr/0010-tanstack-start-shell.md): TanStack Start shell with SSR off.
- [0011](adr/0011-design-system-foundation.md): design system foundation (light-only Tomato and
  Butter).
- [0012](adr/0012-core-ui-standardization.md): core UI standardization (eleven primitives, one
  contract).
