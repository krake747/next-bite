# PR preview environments with per-PR backends (local plan)

Local-only ticket set. No GitHub issues. If these ever move to GitHub, the parent becomes the parent
issue and S1..S5 become sub-issues carrying `Part of #<parent>` lines, numbered branches
(`feat/NNN-<slug>`) replace the slug branches below, and labels follow `triage-labels.md`.

## Parent

### Context

PR #165 recorded the environments target state in ADR-0024 and `docs/environments.md`. This plan
implements previews with one Convex deployment per PR instead of the shared dev backend. Production
Convex and the release pipeline are parked (see Out of scope). Locked decisions from grilling
(2026-11-10, revised to per-PR backends):

- Now topology: localhost and `nextbite.kevinkraemer.com` talk to the dev db. Every PR gets its own
  Convex deployment with its own schema, data, and identity.
- Later topology (separate future work): `nextbite.kevinkraemer.com` talks to prod.
- The preview workflow produces per-PR backend URLs at runtime and feeds them into the Worker build.
  Nothing hardcodes dev values, so the later cutover stays a config change.
- Secret values come from the owner's dashboards. Agents wire everything else and never touch live
  backends unprompted.
- S1 (pattern CORS matcher) and S4 (seed function) are already built on the
  `feat/preview-environments` integration branch. S1 stays as fallback; S4 runs unattended on every
  preview push.

### Goal

Every PR gets an isolated preview (own backend, own data, own URL) that no other PR, local dev
session, or prod traffic can disturb.

### Scope

- S1 upload CORS accepts origin patterns (built, fallback)
- S2 preview workflow with per-PR backend
- S3 preview cleanup including the deployment
- S4 seed function (built, runs at creation)
- S5 dev backend settings and preview environment

### Acceptance

- Opening or pushing a PR (draft or stacked included) updates one preview link comment, and the link
  serves the PR's build against the PR's own backend.
- Two PRs with conflicting schema changes both stay green and reviewable.
- Uploads work from a preview URL; look-alike origins stay blocked.
- Closing a PR deletes its preview versions and its deployment, and comments that the preview is
  gone.
- Rerunning the workflow for the same PR reuses its deployment and data.
- `pnpm check:full` is green on `main` after each landing.

### Out of scope

- Production deployment and prod cutover (parked).
- Release gate fix, Convex-then-Worker release, real-domain smoke test, production environment, prod
  `SITE_URL` (parked until the prod cutover).
- Cloudflare Access on preview URLs (see Later).

### Agents

Work happens in S1..S5, one sub and one draft PR at a time, each rebased onto current `main` before
merge. Close this plan only when every sub is done and Acceptance holds.

### Later

- Cloudflare Access on preview URLs so previews stop being public.

---

## S1: Accept origin patterns in upload CORS (built, fallback)

### Problem

File uploads from a preview URL are blocked because upload CORS only matches exact origins.

### Goal

Upload CORS accepts the same origin patterns auth trusts, with look-alikes rejected and tests
proving both sides.

### Why

Per-PR deployments set their exact alias as `SITE_URL`, so exact matching covers the normal case.
The pattern matcher remains as fallback for stacked and edge cases.

### Work

- Shared origin matcher in the Convex backend covering exact origins plus the
  `https://pr-*-next-bite.<subdomain>.workers.dev` pattern from `APP_ORIGINS`, using parsed hosts
  (never string prefixes). Built on the integration branch.
- Use it in upload CORS; null-origin and loopback behavior unchanged.
- Rejections covered: `http://` variants, other subdomains, suffix tricks such as
  `...workers.dev.evil.com`.
- Pure tests for allowed and rejected origins.

### Verify

- `pnpm check:full` is green. Done on the integration branch.

### Agents

Branch: `feat/preview-cors-patterns` (merged to the integration branch).

---

## S2: Deploy a preview Worker with a per-PR backend

### Problem

There is no way to open a PR's build in a browser without pulling the branch locally, and the shared
dev backend cannot isolate schema changes between PRs.

### Goal

Every PR push publishes a preview Worker alias backed by that PR's own Convex deployment, linked
from a single comment that stays current.

### Why

Reviewing changes needs the running build, and stacked or concurrent PRs with conflicting schema
changes must each stay reviewable.

### Work

- Workflow triggers on `pull_request` (opened, synchronize, reopened), never `pull_request_target`.
  All PRs targeting `main` qualify, drafts and stacked PRs included. Fork PRs are skipped. Per-PR
  concurrency with `cancel-in-progress: true`, mirroring the PR workflow shape.
- On push: deploy with `npx convex deploy --preview-name="pr-<n>"`, which creates the preview
  deployment if missing and otherwise reuses it with its data intact. Never use `--preview-create`
  here: it deletes and recreates every time, wiping preview data on each push. Authenticate with a
  preview deploy key from the project dashboard settings (explicit name beats the GitHub Actions
  auto-detection so reuse stays predictable).
- Deploy Convex functions and schema to the preview deployment. After the alias URL is known and
  SITE_URL is set, run the S4 seed with
  `npx convex run seed:previewBaseline --deployment "preview/pr-<n>"` on every push (it is
  idempotent, so reuse is a no-op and post-expiry recreation reseeds; internal-only functions are
  callable this way with the deploy key, the same path the backend workflow uses for its internal
  migration). Never use `--preview-run` or `--preview-create` here: the former fails by construction
  before SITE_URL exists, and the latter wipes data on every push.
- Build the Worker with the preview deployment's `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL`
  produced by the workflow at runtime, then
  `cf workers versions create --preview-alias pr-<n> --tag pr-<n>`.
- Set `previewUrls: true` in the Cloudflare worker config.
- Set the preview deployment's `SITE_URL` to its exact alias URL so auth, OAuth, and email links
  point at the preview itself.
- One sticky PR comment holds the preview link; every push updates it in place. Comment and upload
  use `GITHUB_TOKEN`; Cloudflare and Convex use the `preview` environment's secrets.

### Verify

- `pnpm check:full` is green, plus: open two draft PRs with conflicting schema changes, confirm both
  previews stay working, push twice to one and confirm its data survives while the other is
  untouched. Live proof is pending the first real run.

### Out of scope

- Production deploy (parked). Shared-dev preview behavior (superseded).

### Agents

Branch: `feat/preview-workflow`. Takeover: quote this Goal at pickup. Blocked by the `preview`
environment existing with its secrets (owner provisions values, agent wires references).

---

## S3: Clean up the preview deployment when a PR closes

### Problem

Closed PRs leave preview versions and deployments behind, spending account limits with nobody
noticing.

### Goal

Closing a PR removes its preview versions and its deployment, tells the PR, and records what happens
to the alias URL.

### Why

Cloudflare cannot remove an alias, so version cleanup plus deployment deletion is the only way to
leave nothing behind.

### Work

- On `pull_request` close, delete the versions tagged `pr-<n>` that are not deployed:
  `cf workers versions delete <id> --worker-id next-bite --force`.
- Delete the `pr-<n>` preview deployment.
- Comment on the PR that the preview is gone.
- Test whether deleting the versions frees the alias URL immediately, and record the result in
  `docs/environments.md` (preview section).
- Backstop: preview deployments auto-expire (5 days on Free/Starter, 14 on paid plans), so abandoned
  PRs clean themselves up even if the workflow never runs. The flip side goes in the S5 limits: a PR
  open past expiry loses its backend data and reseeds on the next push.

### Verify

- `pnpm check:full` is green, plus: close a test PR and confirm versions and deployment gone,
  comment posted, and docs updated with the alias finding. Live proof is pending the first real run.

### Agents

Branch: `feat/preview-cleanup`. Takeover: quote this Goal at pickup.

---

## S4: Seed users, places, and a group (built, runs at creation)

### Problem

A fresh preview deployment starts empty, so every preview needs the same baseline without manual
setup.

### Goal

Preview creation produces a fixed baseline dataset automatically, safe to rerun.

### Why

Per-PR backends multiply the setup problem: without an automatic seed, every preview starts blank.

### Work

- Internal Convex seed function following the existing `migrate:<name>` pattern: 2 users created
  through the Better Auth email sign-up API (owner plus friend), 3 places, 1 group containing both
  users. Built on the integration branch.
- Key everything by email and slug so reruns are no-ops.
- Wire it into preview creation by running it after SITE_URL is set on every push (in S2, not here).
  The exact manual command against the dev deployment is `npx convex run seed:previewBaseline` from
  a dev-authenticated checkout, with no flags.

### Verify

- `pnpm check:full` is green. Done on the integration branch. Live proof comes with the first S2
  preview creation.

### Agents

Branch: `feat/preview-seed` (merged to the integration branch). The S2 author, not the owner,
triggers the first live run through preview creation.

---

## S5: Dev backend settings and preview environment

### Problem

CI secrets, mail safety, and the preview environment are placeholders in docs, so S2 has nothing to
point at.

### Goal

Dev and CI settings exist exactly as the workflow and seed tickets assume, with no shared-backend
wildcard config left over.

### Why

This is the settings-only ticket the workflow ticket builds on; landing it first unblocks S2.

### Work

- `preview` GitHub environment holds a preview deploy key (dashboard project settings, with rights
  to create preview deployments), the Cloudflare token and account id, and a `*.workers.dev` Maps
  key. Per-PR backend URLs are produced at runtime, never stored. The repo's `convex` package
  (1.49.0) satisfies the CLI requirements.
- No `APP_ORIGINS` wildcard is needed for previews: each preview deployment sets its exact alias as
  `SITE_URL`, and exact CORS matching covers it with S1 as fallback. Local dev stays on loopback,
  which is always trusted.
- Mailgun stays unset on every preview deployment so previews cannot send email and the one-time
  code option stays hidden. `MAILGUN_DEV_FALLBACK` is not set.
- Document the known limits in `docs/environments.md`: first push per PR takes minutes (deploy plus
  seed); a PR open past preview expiry (5 days Free/Starter, 14 paid) loses its backend data and
  reseeds on the next push; stale PRs must actually close to free their deployment; plan deployment
  limits bound how many concurrent previews can exist.
- Owner provisions all secret values; agents wire references and docs.

### Verify

- Docs change notes the skip instead of `check:full` where nothing executable changed; code changes
  (if any) keep `pnpm check:full` green. Live check happens with the first S2 preview.

### Out of scope

- Any production value (parked).

### Agents

Branch: `feat/preview-settings`. Takeover: quote this Goal at pickup.
