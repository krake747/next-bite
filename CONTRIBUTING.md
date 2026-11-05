# Contributing

Contributions are welcome! By submitting a pull request, you agree that your contribution will be
licensed under the GNU Affero General Public License v3.0.

## Setup

- Install with `vp install` (delegates to `pnpm`). Node floor lives in `package.json` `engines`,
  pinned in `.node-version`.
- Clone and enter the repo:

```bash
git clone git@github.com:krake747/next-bite.git
cd next-bite
```

- Copy the example env file. Var names are owned by `.env.example`; validation lives in
  `src/core/env.ts`:

```bash
cp .env.example .env.local
```

- Fill in your Convex deployment values from your Convex dashboard (see
  [Convex quickstart](https://docs.convex.dev/quickstart)). For production deploys, put the same
  keys in `.env.production.local` (gitignored, never committed) and export them first:

```bash
set -a; . ./.env.production.local; set +a; pnpm deploy
```

- Set the server-side Convex vars (never print their values):

```bash
npx convex env set CONVEX_SITE_URL "https://your-deployment.convex.site"
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
```

- Add a Google Maps API key to `.env.local` (get one from
  [Google Cloud Console](https://console.cloud.google.com/), with Maps JavaScript API and Places API
  enabled). For Advanced Markers you need a Map ID; `DEMO_MAP_ID` works for testing, create one in
  Maps Management for production.
- Start the backend, then the frontend (separate terminals):

```bash
pnpm convex:dev
pnpm dev
```

- Open [http://localhost:5173](http://localhost:5173) in your browser.
- Commands live in `docs/agents/toolchain.md`. Deploying the frontend needs `cf auth login` or
  `CLOUDFLARE_API_TOKEN`; ask a human before deploying.

## Workflow

- Default branch is `main`. Base branches on `origin/main`, target PRs at `main`.
- Name branches `<type>/NNN-short-slug`, for example `feat/123-group-invites`.
- Use conventional commits: `type(scope): subject`. Types in use: `feat`, `fix`, `refactor`, `docs`,
  `chore`, `test`.
- Issues follow `docs/agents/ticket-anatomy.md`. PRs that close an issue carry `Fixes #<n>` in the
  description; non-closing links use `Refs #<n>` or `Part of #<n>`.
- Labels follow `docs/agents/triage-labels.md`: one type and one primary `area:` label per issue.

## Before pushing

- Run `pnpm check:full` (stop at first failure). The pre-push hook runs `pnpm check`.
- Never push with `--no-verify`.
- PR CI runs the same full gate (`.github/workflows/pr.yml`).

## Guidelines

- Keep changes small and focused
- Follow existing formatting and lint rules
- Be respectful

## License

This project is licensed under the GNU Affero General Public License v3.0. See [LICENSE](./LICENSE)
for details.

Thank you for contributing!
