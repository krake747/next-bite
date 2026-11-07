# Next Bite Agent

Use this file as a routing layer into the repo docs.

- This project is a restaurant recommendation web app. Stack details live in `package.json`: React,
  TypeScript, Tailwind CSS, and TanStack. Convex owns the backend, Base UI owns headless primitives,
  `vp` (Vite+) owns the toolchain, Vitest owns testing in tiers, fallow owns layer boundaries.
- The following are safe to run without asking: `pnpm fmt`, `pnpm fmt:check`, `pnpm lint` on files
  you touched, `pnpm lint:ts`, `pnpm test` scoped to files you changed, and `pnpm fallow audit`.
  Run, fix, and rerun them without per-step approval. Ask before `pnpm deploy`,
  `pnpm convex:deploy`, or any secrets change.
- Shared non-negotiables (prod ownership, commits, prose, simplicity, ADRs, docs): see
  `docs/agents/non-negotiables.md`.
- Commit shape: `type(scope): subject`. Types in use: `feat`, `fix`, `refactor`, `docs`, `chore`,
  `test`. Enforced by `.commitlintrc.json`.
- Default branch is `main`. Base worktrees on `origin/main`, target PRs at `main`, diff against
  `origin/main`.
- Branch names follow `docs/agents/agent-contract.md`: `<type>/NNN-short-slug`.
- When working on Convex code, always read `convex/_generated/ai/guidelines.md` first. It overrides
  training-data defaults.
- Layers live in `src/` plus `convex/`, owned by `.fallowrc.json`. Shared utilities in `core/`, the
  Convex adapter in `api/` (the only layer that touches generated code and SDK libs), low-level
  components in `ui/`, composable patterns in `pattern/`, feature areas in `features/`, pages in
  `routes/`, backend in `convex/`. Read the owner for exact zones and import rules.

## Read on demand

Load the documents below on demand for the task at hand. Treat their instructions as mandatory.

- Shared non-negotiables: `docs/agents/non-negotiables.md`.
- Coding standards for review: `CODING_STANDARDS.md`.
- Documentation hygiene and CI gate: `docs/agents/ci-gate.md`.
- GitHub work: `docs/agents/issue-tracker.md`.
- Ticket shape: `docs/agents/ticket-anatomy.md` plus one file in `docs/agents/templates/`.
- Placement and levels: `docs/agents/tracker-map.md`.
- Labels: `docs/agents/triage-labels.md`.
- Contract, close, and status: `docs/agents/agent-contract.md`.
- Worktrees and stacked PRs: `docs/agents/worktrees.md` and `docs/agents/stacked-prs.md`.
- Terms or ADR questions: `docs/agents/domain.md` plus `GLOSSARY.md`.
- Behavior proof from routes or specs: `docs/agents/verify.md`.
- Shell and toolchain: `docs/agents/toolchain.md`.
- Tests by tier: `docs/agents/testing.md`.
- Owned values and pointers: `docs/agents/sources-of-truth.md`.
- Contributor setup and workflow: `CONTRIBUTING.md`.
- Load only docs your task needs.

## Rules and their enforcers

Each rule names what fails when it breaks. A rule enforced only by this file is a judgment call;
when one repeats, move it up to a type, lint, or test in the same change.

| Rule                                                                                     | Enforced by                                                                                |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Env reads only through `src/core/env.ts`                                                 | `nextbite/no-direct-env-read` lint; ADR-0010 binds                                         |
| React Compiler owns memoization; no `useMemo`, `useCallback`, `React.memo`               | `nextbite/no-manual-memo` lint; ADR-0009 binds                                             |
| Semantic Tailwind tokens only; no raw hex in components; light-only, no `.dark` styles   | Judgment only; ADR-0019 binds                                                              |
| Base UI primitives only; CVA variants; wrappers own styling, call sites pass layout only | `shadcn/no-restyle` lint                                                                   |
| Layer imports stay inside `.fallowrc.json` zones                                         | `pnpm fallow audit` (boundary-violation errors)                                            |
| Commit shape `type(scope): subject`                                                      | lefthook `commit-msg` (`pnpm commitlint`)                                                  |
| Never `git push --no-verify`; local gate is the PR gate                                  | Bound in `docs/agents/ci-gate.md`                                                          |
| Agents run `pnpm check:arch` before pushing structural changes                           | Judgment only; structural means moving files, new modules, shapes, or imports across zones |
| `export` on declarations, no trailing lists; `use()` for context                         | `nextbite/no-export-list`, `nextbite/no-use-context` lint                                  |
| Types over interfaces; never cast types, fix at source                                   | `pnpm lint:ts` plus review                                                                 |
| No em dashes in prose                                                                    | Judgment only; see `non-negotiables.md`                                                    |
