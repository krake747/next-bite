# Sources of truth

Read this when a doc or comment states a value another file owns. Point at the owner; never restate
the value. When you add a new owned value, add a row here and point at it.

| Value                             | Owner                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| Node version                      | `.node-version`; `package.json` `engines` floor                                           |
| Package manager and install       | `pnpm` v12 via `vp install`; scripts in `package.json`                                    |
| Lint and format rules             | `vite.config.ts` (`vp lint`, `vp fmt`); no separate dotfiles                              |
| Layer zones and import boundaries | `.fallowrc.json`; zone table in `AGENTS.md`                                               |
| Commit shape                      | `.commitlintrc.json` (conventional commits); shape in `AGENTS.md`                         |
| Local gate and full gate          | `package.json` (`check`, `check:arch`, `check:full`); lefthook pre-push runs `pnpm check` |
| PR and push CI                    | `.github/workflows/pr.yml`, `.github/workflows/main.yml`                                  |
| Release process                   | `.github/workflows/release.yaml`; `docs/agents/toolchain.md` overview                     |
| Env names and validation          | `src/core/env.ts`; policy in ADR-0006                                                     |
| Convex schema and functions       | `convex/schema.ts`, `convex/`; guidelines in `convex/_generated/ai/guidelines.md`         |
| Convex migrations                 | `docs/migrations.md`, `convex/migrate.ts`                                                 |
| Hosting and deploy target         | `cloudflare.config.ts`; `docs/agents/toolchain.md` overview                               |
| Test tiers and runners            | `vite.config.ts` projects; `docs/agents/testing.md` overview                              |
| Tracker labels and placement      | `docs/agents/triage-labels.md`, `docs/agents/tracker-map.md`                              |
| Ticket shape                      | `docs/agents/ticket-anatomy.md`, `docs/agents/templates/`                                 |
| Glossary and ADRs                 | `GLOSSARY.md`, `docs/adr/`                                                                |
| Code owners                       | `.github/CODEOWNERS`                                                                      |
