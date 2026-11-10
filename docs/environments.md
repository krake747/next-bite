# Environments and release

Mechanics for ADR-0024. Previews ship from the preview workflow; production ships from the deploy
workflow on green `main`, backend first. `convex.yml` ships a backend by hand.

## Environments

| Environment | Backend                                                                                  | Worker                                             | Ships from                      |
| ----------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------- |
| Production  | Convex prod deployment (reads dev until the cutover)                                     | `next-bite` on `https://nextbite.kevinkraemer.com` | `deploy.yml`, on green `main`   |
| Local       | Your Convex dev deployment                                                               | `vp dev` on `http://localhost:5173`                | `pnpm convex:dev`               |
| Preview     | One Convex preview deployment per PR (`pr-<n>`), with its own schema, data, and identity | `pr-<n>-next-bite.<subdomain>.workers.dev`         | preview workflow, every PR push |

`convex.yml` stays for deploying a backend by hand, with or without migrations.

Current topology: localhost and `nextbite.kevinkraemer.com` both read the shared dev backend. The
production cutover (its own Convex deployment, the `production` environment, release wiring) is
parked; when it lands, localhost and previews stay on dev and only the production domain moves to
prod. The cutover is a config change: point the `backend` job in `deploy.yml` at the prod GitHub
environment (environment name and concurrency group) and swap the `VITE_CONVEX_*` secrets.

## Deploy order (production)

```text
push to main -> Main gate green -> deploy.yml (same SHA for every job)
  backend    npx convex deploy with the dev environment's deploy key,
             then .github/scripts/backend-migrate.sh in order
  worker     vp run build, then cf deploy
  smoke      GET https://nextbite.kevinkraemer.com until it serves the build
```

Any failed step stops the rest, so a backend that fails to deploy never gets a Worker calling it.
The backend job shares the `convex-dev` concurrency group with `convex.yml` runs against `dev`, so
the two never push to the dev deployment at once. The migration list lives in
`.github/scripts/backend-migrate.sh`, shared by both workflows. A manual `deploy.yml` dispatch
redeploys the current `main` without a push. `pnpm convex:dev` still pushes local functions to the
same dev deployment until the cutover; the next production deploy overwrites them.

## GitHub environments and secrets

| Name                       | Scope      | Holds                                                                      |
| -------------------------- | ---------- | -------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`     | repository | Workers deploy and version upload                                          |
| `CLOUDFLARE_ACCOUNT_ID`    | repository | Cloudflare account                                                         |
| `VITE_CONVEX_URL`          | repository | dev `.convex.cloud` URL until the cutover, baked into the production build |
| `VITE_CONVEX_SITE_URL`     | repository | dev `.convex.site` URL until the cutover, baked into the production build  |
| `VITE_GOOGLE_MAPS_API_KEY` | repository | Maps key restricted to the production domain plus `*.workers.dev`          |
| `CONVEX_DEPLOY_TOKEN`      | `dev`      | dev deployment deploy key (deploy plus run functions) for production ships |
| `CONVEX_DEPLOY_TOKEN`      | `preview`  | preview deploy key from the dashboard project settings                     |
| `CLOUDFLARE_API_TOKEN`     | `preview`  | token used only by preview deploys                                         |
| `CLOUDFLARE_ACCOUNT_ID`    | `preview`  | account id used only by preview deploys                                    |
| `VITE_GOOGLE_MAPS_API_KEY` | `preview`  | same shared Maps key (already covers `*.workers.dev` preview hosts)        |

`VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` are never stored for previews. The preview workflow
reads them from the `convex deploy` output at runtime and bakes them into that PR's Worker build.
The preview, deploy, and Convex workflows export the `CONVEX_DEPLOY_TOKEN` secret value as
`CONVEX_DEPLOY_KEY`, the variable name the Convex CLI reads; the cleanup workflow uses the same
secret value directly as a Bearer token for its REST calls. The repo's `convex` package (1.49.0)
satisfies the CLI requirements for preview deploy commands.

`preview` has no required reviewer, so it runs on every push. There is no `production` environment
yet (its reviewer rule arrives with the cutover); the production Worker deploys from repository
secrets and the production backend ship uses the `dev` environment. `convex.yml` and
`docs/migrations.md` still name environments `dev` and `prod`.

### Owner values checklist

The owner provisions every secret value by hand. Agents wire references and docs, and never touch
live backends unprompted.

| #   | Value                                                        | Where it comes from                       | Where it goes                                                  |
| --- | ------------------------------------------------------------ | ----------------------------------------- | -------------------------------------------------------------- |
| 1   | Preview deploy key with rights to create preview deployments | Convex dashboard, project settings        | GitHub `preview` environment secret `CONVEX_DEPLOY_TOKEN`      |
| 2   | Cloudflare API token for preview deploys                     | Cloudflare dashboard                      | GitHub `preview` environment secret `CLOUDFLARE_API_TOKEN`     |
| 3   | Cloudflare account id                                        | Cloudflare dashboard                      | GitHub `preview` environment secret `CLOUDFLARE_ACCOUNT_ID`    |
| 4   | Maps browser key restricted to `*.workers.dev` preview hosts | Google Cloud console                      | GitHub `preview` environment secret `VITE_GOOGLE_MAPS_API_KEY` |
| 5   | Dev deployment deploy key (deploy and run functions)         | Convex dashboard, dev deployment settings | GitHub `dev` environment secret `CONVEX_DEPLOY_TOKEN`          |

Dev-deployment settings that stay as-is: the dev deployment keeps its own `SITE_URL`
(`http://localhost:5173`), its own `BETTER_AUTH_SECRET`, and its optional Mailgun sandbox pair for
OTP testing. Nothing preview specific is stored on the dev deployment.

## Convex deployment environment

Set with `npx convex env set` on each deployment, never in GitHub.

| Variable                 | Production                          | Dev (local only)                    | Preview (per PR, `pr-<n>`)                                                                         |
| ------------------------ | ----------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`     | own value                           | own value                           | own value, set when the deployment is created                                                      |
| `SITE_URL`               | `https://nextbite.kevinkraemer.com` | `http://localhost:5173`             | exact alias `https://pr-<n>-next-bite.<subdomain>.workers.dev`, set by the workflow at deploy time |
| `APP_ORIGINS`            | unset                               | unset (loopback is always trusted)  | unset (exact `SITE_URL` match covers previews; S1 pattern match is fallback)                       |
| `AUTH_EMAIL_OTP_ENABLED` | `true` when mail is ready           | unset                               | unset                                                                                              |
| `MAILGUN_API_KEY`        | prod key                            | unset, or a sandbox key to test OTP | unset                                                                                              |
| `MAILGUN_DOMAIN`         | prod sending domain                 | unset, or the sandbox domain        | unset                                                                                              |
| `MAILGUN_DEV_FALLBACK`   | unset                               | unset                               | unset                                                                                              |
| `GOOGLE_MAPS_API_KEY`    | prod key                            | dev key                             | preview `*.workers.dev` key                                                                        |

`SITE_URL` and `APP_ORIGINS` come from the server-session change; the rest exist on `main`. No
shared-backend wildcard config remains: previews do not use an `APP_ORIGINS` wildcard, and the dev
deployment carries no preview origins.

### Trusted origin patterns

Each preview deployment sets its exact alias as `SITE_URL`, so exact CORS matching covers the normal
case. The pattern below remains as fallback for stacked and edge cases. Local dev stays on loopback,
which is always trusted, so it needs no entry.

Better Auth 1.7 accepts wildcards in `trustedOrigins`.
`https://pr-*-next-bite.<subdomain>.workers.dev` matches
`https://pr-12-next-bite.<subdomain>.workers.dev` and rejects `http://` on the same host,
`https://next-bite.<subdomain>.workers.dev` (the production workers.dev host), other subdomains, and
suffix tricks such as `...workers.dev.evil.com`. `*` does cross dots, so
`pr-1.x-next-bite.<subdomain>.workers.dev` also matches; every such host is still inside the
account's own workers.dev subdomain.

Two places do not understand the pattern:

- `@convex-dev/better-auth` 0.13 drops wildcard entries when it picks the request origin to forward
  to Better Auth. A preview request is then handled as if it came from the deployment's own site
  URL, and Better Auth builds URLs from the static `SITE_URL`. Password sign-in is unaffected; OAuth
  callbacks and emailed links would point at the wrong host. Per-PR backends fix this with an exact
  `SITE_URL` per preview.
- `convex/cors.ts` checks exact origins first, then the S1 pattern matcher over `APP_ORIGINS`. With
  per-PR backends the exact `SITE_URL` match covers the normal case and the pattern match stays as
  fallback.

### Preview mail

Password sign-up needs no mail (`requireEmailVerification: false`). `MAILGUN_API_KEY` and
`MAILGUN_DOMAIN` stay unset on every preview deployment, so previews cannot send email and
`getAuthMethods` hides the one-time code option. `MAILGUN_DEV_FALLBACK` is not set on any preview
deployment. The dev backend rules are unchanged: with `MAILGUN_*` unset it behaves the same way, and
a Mailgun sandbox domain is set only to test OTP; sandbox domains deliver only to authorized
recipients. `convex/email.ts` always calls `api.eu.mailgun.net`, so a sandbox domain used for OTP
testing must live in the EU region. Never set `MAILGUN_DEV_FALLBACK` on a backend a preview uses: it
turns OTP on without delivering the code.

## Previews

```text
on pull_request (opened, synchronize, reopened), any base branch
  skip when the head repository is a fork
  backend    npx convex deploy --preview-name="pr-<n>" with the preview environment's deploy key
             (creates the deployment when missing, otherwise reuses it with data intact;
             never --preview-create here, which wipes data on every push)
  build      vp run build with the preview deployment's VITE_CONVEX_URL and
             VITE_CONVEX_SITE_URL from the deploy output
  upload     cf workers versions create --preview-alias pr-<n> --tag pr-<n>
  env        set the preview deployment's SITE_URL to its exact alias URL
  seed       npx convex run seed:previewBaseline --deployment "preview/pr-<n>" on every push
             (idempotent: a no-op on reuse, a repopulate after expiry recreation)
  comment    sticky PR comment with the alias URL from "Version Preview Alias URL:"

on pull_request (closed)
  delete versions tagged pr-<n> that are not deployed: cf workers versions delete <id> --worker-id next-bite --force
  delete the pr-<n> preview deployment
  comment    preview removed

Live proof, 2026-11-10 (manual dispatches for pr-166 and pr-169): deleting the
versions kills the alias URL immediately (both aliases went from 200 to 404),
and deleting the deployment removes its data. The S2 creation path and the S3
close path are both observed working end to end.
```

### Preview limits

- The first push per PR takes minutes: the preview deployment is created, the Worker version
  uploads, then SITE_URL is set and the seed baseline runs before the comment posts.
- A PR open past preview expiry loses its backend data and reseeds on the next push. Preview
  deployments auto-expire (5 days on Free and Starter plans, 14 days on paid plans), so a stale PR
  gets a fresh empty backend that the seed repopulates.
- Stale PRs must actually close to free their deployment. Closing a PR deletes its preview versions
  and its deployment; abandoned PRs rely on expiry instead.
- Cloudflare refuses to delete the single latest Worker version. Cleanup keeps it and moves on; the
  next upload makes it deletable, and the alias limit evicts it eventually.
- Plan deployment limits bound how many concurrent previews can exist. Each open PR holds one
  preview deployment plus its Worker versions, so closing merged PRs keeps headroom.

Facts from `cf` 1.0.0-beta.27 and the Cloudflare docs:

- `cf workers versions create --preview-alias` uploads a version without deploying it and prints
  `Version Preview Alias URL: https://<alias>-next-bite.<subdomain>.workers.dev`.
- An alias can only be set at upload. There is no command to remove or move one; the alias is an
  annotation on the version. Deleting the version is the only cleanup, and it frees the alias URL
  immediately: after the pr-166 and pr-169 cleanups both aliases went from serving 200 to 404.
- Cloudflare keeps the 1000 most recently deployed aliases and drops the oldest past that.
- Version URLs need `previewUrls` enabled (`previewUrls: true` in `cloudflare.config.ts`). When
  unset they follow the workers.dev setting. Version URLs are public unless Cloudflare Access
  protects them.
- Alias plus Worker name must fit a 63-character DNS label, so `pr-<n>-next-bite` is fine.

## Seed data

The baseline dataset is the idempotent internal function `seed:previewBaseline` in `convex/seed.ts`:
two users created through the Better Auth email sign-up API (`preview-owner@example.com` and
`preview-friend@example.com`), three restaurants keyed by slug, and a `Preview dinner club` group
containing both users. Users are keyed by email, restaurants by a `seed:<slug>` marker in
`clientMutationId`, and the group by owner plus name, so reruns return what already exists and
change nothing. Auth tables are never written directly; the app `profiles` row is the idempotency
marker for users, and landing aggregates stay exact through the same counter adjustment the app
writes use.

The owner runs it once against the shared dev backend, by hand, never from an agent session and
never against production:

```bash
npx convex run seed:previewBaseline
```

The command targets whichever deployment the CLI is authenticated to, so run it from a checkout
configured for the dev deployment. No flags are needed for the dev case. Sign in to the seed
accounts with the dev-only password in `convex/seed.ts` (`SEED_PASSWORD`). With per-PR backends the
same function runs on every preview push through
`npx convex run seed:previewBaseline --deployment "preview/pr-<n>"` after the workflow sets
SITE_URL; that wiring is not built here.
