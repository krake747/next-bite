# Environments and release

Mechanics for ADR-0024. This is the target state: the release and preview workflows described here
land in follow-up pull requests. Until then `release.yml` ships only the Worker and `convex.yml`
ships the backend.

## Environments

| Environment | Backend                                                                          | Worker                                             | Ships from                      |
| ----------- | -------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------- |
| Production  | Convex prod deployment                                                           | `next-bite` on `https://nextbite.kevinkraemer.com` | `release.yml`, manual           |
| Local       | Your Convex dev deployment                                                       | `vp dev` on `http://localhost:5173`                | `pnpm convex:dev`               |
| Preview     | Shared Convex dev deployment for now; later one Convex preview deployment per PR | `pr-<n>-next-bite.<subdomain>.workers.dev`         | preview workflow, every PR push |

`convex.yml` stays for deploying the dev backend by hand.

## Release order

```text
release (workflow_dispatch: bump_type, dry_run)
  compute version
  gate       wait for main.yml on github.sha; no run or not green -> fail
  backend    npx convex deploy (production environment), then migrations in order
  worker     vp run build, then cf deploy
  smoke      GET https://nextbite.kevinkraemer.com until it serves the build
  publish    tag vX.Y.Z, GitHub release
```

Any failed step stops the rest. A dry run typechecks the backend and dry-runs the Worker deploy.

### What the current `release.yml` does instead

- The gate polls `pr.yml` runs with `head_sha` set to the dispatched SHA. `pr.yml` runs on PR head
  commits, and a squash merge creates a new commit on `main`, so the query returns nothing. After
  ten polls 30 seconds apart (about five minutes) it prints `no CI run for <sha>; proceeding` and
  exits 0. At the time of writing, `main` head has one `main.yml` push run and zero `pr.yml` runs.
- The smoke test greps the first `*.workers.dev` URL out of the `cf deploy` log and curls that. It
  never touches the custom domain, which `cloudflare.config.ts` does not declare, so a broken route
  or domain binding still passes.
- No backend deploy happens in the release.

## GitHub environments and secrets

| Name                       | Scope        | Holds                                                              |
| -------------------------- | ------------ | ------------------------------------------------------------------ |
| `CLOUDFLARE_API_TOKEN`     | repository   | Workers deploy and version upload                                  |
| `CLOUDFLARE_ACCOUNT_ID`    | repository   | Cloudflare account                                                 |
| `CONVEX_DEPLOY_TOKEN`      | `production` | prod deployment deploy key                                         |
| `VITE_CONVEX_URL`          | `production` | prod `.convex.cloud` URL, baked into the build                     |
| `VITE_CONVEX_SITE_URL`     | `production` | prod `.convex.site` URL, baked into the build                      |
| `VITE_GOOGLE_MAPS_API_KEY` | `production` | Maps key restricted to the production domain                       |
| `CONVEX_DEPLOY_TOKEN`      | `preview`    | dev deployment deploy key now; a preview deploy key later          |
| `VITE_CONVEX_URL`          | `preview`    | dev `.convex.cloud` URL now; per-PR URL from `convex deploy` later |
| `VITE_CONVEX_SITE_URL`     | `preview`    | dev `.convex.site` URL now; per-PR URL later                       |
| `VITE_GOOGLE_MAPS_API_KEY` | `preview`    | Maps key restricted to `*.workers.dev` preview hosts               |

`production` carries a required reviewer (Kevin). `preview` has none, so it runs on every push. The
repository has no GitHub environments yet, and `convex.yml` and `docs/migrations.md` still name them
`dev` and `prod`.

## Convex deployment environment

Set with `npx convex env set` on each deployment, never in GitHub.

| Variable                 | Production                          | Dev (shared with previews)                                             |
| ------------------------ | ----------------------------------- | ---------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`     | own value                           | own value                                                              |
| `SITE_URL`               | `https://nextbite.kevinkraemer.com` | `http://localhost:5173`                                                |
| `APP_ORIGINS`            | unset                               | `http://localhost:5193,https://pr-*-next-bite.<subdomain>.workers.dev` |
| `AUTH_EMAIL_OTP_ENABLED` | `true` when mail is ready           | unset                                                                  |
| `MAILGUN_API_KEY`        | prod key                            | unset, or a sandbox key to test OTP                                    |
| `MAILGUN_DOMAIN`         | prod sending domain                 | unset, or the sandbox domain                                           |
| `MAILGUN_DEV_FALLBACK`   | unset                               | unset                                                                  |
| `GOOGLE_MAPS_API_KEY`    | prod key                            | dev key                                                                |

`SITE_URL` and `APP_ORIGINS` come from the server-session change; the rest exist on `main`.

### Trusted origin patterns

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
- `convex/cors.ts` compares upload origins with `Array.includes`, so preview uploads get no CORS
  headers until it matches patterns.

### Preview mail

Password sign-up needs no mail (`requireEmailVerification: false`). With `MAILGUN_*` unset on the
dev backend, `getAuthMethods` hides email OTP and nothing can be sent. Set a Mailgun sandbox domain
only to test OTP; sandbox domains deliver only to authorized recipients. `convex/email.ts` always
calls `api.eu.mailgun.net`, so the sandbox domain must live in the EU region. Never set
`MAILGUN_DEV_FALLBACK` on a backend a preview uses: it turns OTP on without delivering the code.

## Previews

```text
on pull_request (opened, synchronize, reopened), any base branch
  skip when the head repository is a fork
  backend    npx convex deploy with the preview environment's deploy key
  build      vp run build with the preview environment's VITE_* values
  upload     cf workers versions create --preview-alias pr-<n> --tag pr-<n>
  comment    sticky PR comment with the alias URL from "Version Preview Alias URL:"

on pull_request (closed)
  delete versions tagged pr-<n> that are not deployed: cf workers versions delete <id> --worker-id next-bite --force
  comment    preview removed
```

Facts from `cf` 1.0.0-beta.27 and the Cloudflare docs:

- `cf workers versions create --preview-alias` uploads a version without deploying it and prints
  `Version Preview Alias URL: https://<alias>-next-bite.<subdomain>.workers.dev`.
- An alias can only be set at upload. There is no command to remove or move one; the alias is an
  annotation on the version. Deleting the version is the only cleanup, and whether that frees the
  alias URL immediately is untested.
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
pnpm convex run seed:previewBaseline
```

The command targets whichever deployment the CLI is authenticated to, so run it from a checkout
configured for the dev deployment. Sign in to the seed accounts with the dev-only password in
`convex/seed.ts` (`SEED_PASSWORD`). With per-PR backends the same function runs on creation through
`convex deploy --preview-run`; that wiring is not built here.
