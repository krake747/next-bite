# Contributing

By submitting a pull request, you agree to license your contribution under the GNU Affero General
Public License v3.0.

## Setup

```bash
git clone https://github.com/krake747/next-bite.git
cd next-bite
vp install
cp .env.example .env.local
```

Fill `.env.local` from your Convex dashboard plus a Google Maps key with the Maps JavaScript and
Places APIs enabled. `.env.example` names each value and `src/core/env.ts` validates them. Then set
the backend secrets once (never print them):

```bash
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
npx convex env set SITE_URL http://localhost:5173
```

Password sign-up works with nothing else; the emailed code needs mail config (see
`docs/environments.md`). Start the backend and the frontend in separate terminals, then open
<http://localhost:5173>:

```bash
pnpm convex:dev
pnpm dev
```

Production deploys from CI on green `main`; see `docs/environments.md`.

## Workflow

- Branch from `origin/main` as `<type>/NNN-short-slug` and target PRs at `main`.
- Use conventional commits (`.commitlintrc.json`). A PR that closes an issue says `Fixes #<n>`.
- Run `pnpm check:full` before pushing. The pre-push hook runs the fast gate; never skip it with
  `--no-verify`. PR CI runs the full gate.
- Issues follow `docs/agents/tickets.md`; labels follow `docs/agents/triage-labels.md`.

## Stacked PRs

A stack is a chain of PRs, each targeting the branch below it, merged bottom-up. GitHub's
[`gh stack`](https://github.com/github/gh-stack) extension creates, links, rebases, and merges the
chain; by hand, set each base with `gh pr edit <n> --base <branch>`.

- PR CI and previews run only for PRs into `main`, so a layer gets them on its first push after it
  targets `main`.
- Squash-merging a layer leaves the next one conflicting, because it still holds the pre-squash
  commits. Merge `main` into it and keep its side, or run `gh stack rebase`.
