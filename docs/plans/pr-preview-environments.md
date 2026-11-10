# PR preview environments on shared dev backend (local plan)

Local-only ticket set. No GitHub issues. If these ever move to GitHub, the parent becomes the parent
issue and S1..S5 become sub-issues carrying `Part of #<parent>` lines, numbered branches
(`feat/NNN-<slug>`) replace the slug branches below, and labels follow `triage-labels.md`.

## Parent

### Context

PR #165 recorded the environments target state in ADR-0024 and `docs/environments.md`: previews run
on the shared Convex dev backend, with one preview Worker alias per PR. Production Convex and the
release pipeline are parked (see Out of scope). Locked decisions from grilling (2026-11-10):

- Now topology: localhost, `nextbite.kevinkraemer.com`, and all PR previews talk to the same dev db.
- Later topology (separate future work): localhost and previews talk to dev,
  `nextbite.kevinkraemer.com` talks to prod.
- Workflows read backend URLs from the `preview` GitHub environment, never hardcoded dev values, so
  the later cutover is a config change, not a rewrite.
- Secret values come from the owner's dashboards. Agents wire everything else and never touch live
  backends unprompted. The one-time seed is run by the owner by hand.

### Goal

Every PR gets a working preview URL on shared dev infrastructure, with uploads, auth, and seed data
behaving, while prod keeps serving the dev db untouched.

### Scope

- S1 upload CORS accepts origin patterns
- S2 preview workflow
- S3 preview cleanup when a PR closes
- S4 seed function
- S5 dev backend settings for previews

### Acceptance

- Opening or pushing a PR (draft or stacked included) updates one preview link comment, and the link
  serves the PR's build.
- Uploads work from a preview URL; look-alike origins stay blocked.
- Closing a PR deletes its preview versions and comments that the preview is gone.
- The dev backend carries seed users, places, and a group; reruns change nothing.
- `APP_ORIGINS` on dev covers preview aliases; mail stays off so no email can send.
- `pnpm check:full` is green on `main` after each landing.

### Out of scope

- Per-PR Convex deployments (see Later).
- Cloudflare Access on preview URLs (see Later).
- Release gate fix, Convex-then-Worker release, real-domain smoke test, production environment, prod
  `SITE_URL` (parked until the prod cutover).

### Agents

Work happens in S1..S5, one sub and one draft PR at a time, each rebased onto current `main` before
merge. Close this plan only when every sub is done and Acceptance holds.

### Later

- Convex preview deployment per PR: exact `SITE_URL` and isolated data per preview, fixing
  shared-dev limits (last-push-wins functions, dev `SITE_URL` in emails).
- Cloudflare Access on preview URLs so previews stop being public.

---

## S1: Accept origin patterns in upload CORS

### Problem

File uploads from a preview URL are blocked because upload CORS only matches exact origins.

### Goal

Upload CORS accepts the same origin patterns auth trusts, with look-alikes rejected and tests
proving both sides.

### Why

Without this, every preview is broken for uploads, which is core product surface.

### Work

- Add a shared origin matcher in the Convex backend covering exact origins plus the
  `https://pr-*-next-bite.<subdomain>.workers.dev` pattern from `APP_ORIGINS`, using parsed hosts
  (never string prefixes).
- Use it in upload CORS; keep null-origin and loopback behavior unchanged.
- Rejections to cover: `http://` variants, other subdomains, suffix tricks such as
  `...workers.dev.evil.com`.
- Pure tests for allowed and rejected origins, including the tricky hosts.

### Verify

- `pnpm check:full` is green, plus a live upload attempt from a real preview URL once S2 exists.

### Out of scope

- Changing what auth trusts. Changing `APP_ORIGINS` values (that is S5).

### Agents

Branch: `feat/preview-cors-patterns`. Takeover: quote this Goal at pickup.

---

## S2: Deploy a preview Worker for every PR push

### Problem

There is no way to open a PR's build in a browser without pulling the branch locally.

### Goal

Every PR push publishes a preview Worker alias, linked from a single comment that stays current.

### Why

Reviewing UI changes needs the running build, and the pending shell/auth work lands across stacked
PRs that each need their own link.

### Work

- Workflow triggers on `pull_request` (opened, synchronize, reopened), never `pull_request_target`.
  All PRs targeting `main` qualify, drafts and stacked PRs included. Fork PRs are skipped. Per-PR
  concurrency with `cancel-in-progress: true`, mirroring the PR workflow shape.
- Steps: deploy Convex functions to the dev deployment, build with the `preview` environment's
  `VITE_*` values, then `cf workers versions create --preview-alias pr-<n> --tag pr-<n>`.
- Set `previewUrls: true` in the Cloudflare worker config.
- One sticky PR comment holds the preview link; every push updates it in place. Comment and upload
  use `GITHUB_TOKEN`; Cloudflare and Convex use the `preview` environment's secrets.

### Verify

- `pnpm check:full` is green, plus: open a draft PR, confirm the comment appears and updates on a
  second push, and confirm a fork PR is skipped.

### Out of scope

- Backend per PR (shared dev until Later). Production deploy (parked).

### Agents

Branch: `feat/preview-workflow`. Takeover: quote this Goal at pickup. Blocked by the `preview`
environment existing with its secrets (owner provisions values, agent wires references).

---

## S3: Clean up the preview when a PR closes

### Problem

Closed PRs leave preview versions behind, and nobody knows whether the alias URL dies with them.

### Goal

Closing a PR removes its preview versions, tells the PR, and records what happens to the alias URL.

### Why

Cloudflare cannot remove an alias, so without version cleanup every PR permanently spends versions
against the account limit.

### Work

- On `pull_request` close, delete the versions tagged `pr-<n>` that are not deployed:
  `cf workers versions delete <id> --worker-id next-bite --force`.
- Comment on the PR that the preview is gone.
- Test whether deleting the versions frees the alias URL immediately, and record the result in
  `docs/environments.md` (preview section).

### Verify

- `pnpm check:full` is green, plus: close a test PR and confirm versions gone, comment posted, and
  docs updated with the alias finding.

### Agents

Branch: `feat/preview-cleanup`. Takeover: quote this Goal at pickup.

---

## S4: Seed users, places, and a group on dev

### Problem

The shared dev backend has no baseline data, so every preview starts empty and manual setup drifts
between reviewers.

### Goal

One command creates a fixed baseline dataset on dev, safe to rerun any number of times.

### Why

Previews and local dev need the same starting point, and per-PR backends later will need a seed that
runs unattended at creation.

### Work

- Internal Convex seed function following the existing `migrate:<name>` pattern: 2 users created
  through the Better Auth email sign-up API (owner plus friend), 3 places, 1 group containing both
  users.
- Key everything by email and slug so reruns are no-ops returning what already exists.
- Document the exact run command for the shared dev backend. A later per-PR backend calls it via
  `convex deploy --preview-run`; do not build that wiring here.

### Verify

- `pnpm check:full` is green, plus: run twice against dev, second run changes nothing.

### Out of scope

- Production data. Per-PR backend wiring (Later).

### Agents

Branch: `feat/preview-seed`. Takeover: quote this Goal at pickup. The owner runs the one-time dev
command after merge; agents ship the function and the command only.

---

## S5: Configure the dev backend and preview environment

### Problem

Preview URLs, mail safety, and CI secrets are currently placeholders in docs, so S1..S4 have nothing
to point at.

### Goal

Dev and CI settings exist exactly as the workflow, CORS, and seed tickets assume.

### Why

This is the settings-only ticket the code tickets build on; landing it first unblocks them.

### Work

- `APP_ORIGINS` on the dev deployment includes `https://pr-*-next-bite.<subdomain>.workers.dev` with
  the real subdomain filled in.
- Mailgun stays unset on dev so previews cannot send email and the one-time code option stays
  hidden. `MAILGUN_DEV_FALLBACK` is not set.
- `preview` GitHub environment holds the dev Convex URL, the dev deploy key, and the `VITE_*`
  values; the Cloudflare token is shared from repository scope.
- Document the known limits in `docs/environments.md`: each preview push overwrites dev functions
  (last push wins, affects local dev too); Google sign-in and email links point at the dev
  `SITE_URL`.
- Owner provisions all secret values and the workers.dev subdomain; agents wire references and docs.

### Verify

- Docs change notes the skip instead of `check:full` where nothing executable changed; code changes
  (if any) keep `pnpm check:full` green. Live check: `APP_ORIGINS` readable on dev and mail options
  hidden in a preview build.

### Out of scope

- Any production value (parked).

### Agents

Branch: `feat/preview-settings`. Takeover: quote this Goal at pickup.
