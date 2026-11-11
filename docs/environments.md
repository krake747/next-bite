# Environments and deploys

Mechanics for ADR-0026. The workflows in `.github/workflows/` and their scripts in
`.github/scripts/` own the steps.

## Environments

| Environment | Backend                              | Worker                                     | Ships from                       |
| ----------- | ------------------------------------ | ------------------------------------------ | -------------------------------- |
| Production  | Dev deployment until the cutover     | `https://nextbite.kevinkraemer.com`        | `deploy.yml` on green `main`     |
| Local       | Your dev deployment                  | `pnpm dev` on `http://localhost:5173`      | `pnpm convex:dev`                |
| Preview     | One Convex preview deployment per PR | `pr-<n>-next-bite.<subdomain>.workers.dev` | `preview.yml` on PRs into `main` |

Until the cutover, localhost and the production domain read the same dev backend: `pnpm convex:dev`
pushes local functions that are live at once, and the next production deploy overwrites them. The
cutover gives production its own deployment: point the `backend` job in `deploy.yml` at a
`production` GitHub environment (name and concurrency group) and swap the `VITE_CONVEX_*` secrets.
Localhost and previews stay on dev.

## Production deploy

Every green `Main gate` run on `main`, or a manual dispatch, runs `deploy.yml` on that commit:
backend deploy plus migrations, then the Worker, then a smoke test on the domain. A failure stops
the rest. The backend job shares a concurrency group with `convex.yml`, which deploys the dev
backend by hand.

## Secrets

The owner provisions every value; agents never set secrets.

| Secret                                          | Scope                 | Holds                                                 | From                    |
| ----------------------------------------------- | --------------------- | ----------------------------------------------------- | ----------------------- |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | repository, `preview` | Worker deploys and version uploads                    | Cloudflare dashboard    |
| `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL`       | repository            | Backend URLs baked into the production build          | Convex dashboard        |
| `VITE_GOOGLE_MAPS_API_KEY`                      | repository, `preview` | Maps key restricted to the domain and `*.workers.dev` | Google Cloud console    |
| `CONVEX_DEPLOY_TOKEN`                           | `dev`                 | Dev deploy key that can deploy and run functions      | Dev deployment settings |
| `CONVEX_DEPLOY_TOKEN`                           | `preview`             | Preview deploy key                                    | Project settings        |

Previews store no backend URLs; the workflow reads them from the deploy output. Workflows expose
`CONVEX_DEPLOY_TOKEN` as `CONVEX_DEPLOY_KEY`, the name the Convex CLI reads. No environment requires
a reviewer yet; that arrives with the `production` environment at the cutover.

## Convex deployment env

Set per deployment with `npx convex env set`, never in GitHub.

- `SITE_URL`: the app origin that owns auth cookies. Production uses the public domain, local uses
  `http://localhost:5173`, and each preview gets its exact alias from the workflow.
- `BETTER_AUTH_SECRET`: its own value on every deployment.
- `AUTH_EMAIL_OTP_ENABLED`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`: the emailed code appears only when
  enabled and mail is configured. Previews set none, so they cannot send mail. To test codes
  locally, use a Mailgun sandbox in the EU region (the app always calls the EU API); sandboxes
  deliver only to authorized recipients.
- `MAILGUN_DEV_FALLBACK`: local only. It turns codes on without delivering them, so never set it on
  a deployment that previews or the production domain read.
- `GOOGLE_MAPS_API_KEY`: the server-side Maps key.

While the production domain reads dev, dev's `SITE_URL` decides how production auth builds URLs and
which origin auth trusts.

## Previews

`preview.yml` runs on every push to a same-repo PR into `main`; a stacked PR gets its preview on the
first push after it targets `main`. It deploys the `pr-<n>` backend (reusing it and its data),
builds against it, uploads a Worker version with alias `pr-<n>`, sets `SITE_URL` to the alias, runs
the seed, and keeps one sticky comment with the URL. `preview-cleanup.yml` deletes the PR's Worker
versions and backend when the PR closes, reaps versions left by other closed PRs, and comments.

- The first push per PR takes minutes.
- Preview deployments expire on the Convex plan's schedule. The next push recreates and reseeds.
- An alias is set only at upload and has no remove command; deleting its versions frees the URL.
  Cloudflare refuses to delete the latest Worker version, so cleanup skips it until a later upload.
- Preview URLs are public unless Cloudflare Access protects them.
- Plan limits cap concurrent preview deployments, so close stale PRs.

## Seed data

`seed:previewBaseline` in `convex/seed.ts` is idempotent and holds the seed accounts and their
dev-only password. Previews run it on every push. On dev the owner runs
`npx convex run seed:previewBaseline` once by hand. Never run it against production.
