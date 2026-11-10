# ADR-0024: Environments, pull request previews, and paired releases

Date: 2026-11-10

Status: Superseded by ADR-0026

## Context

The app has two deployables that must agree: the backend on Convex and the Worker on Cloudflare.
Moving the auth session onto the app origin makes that pairing strict. The backend trusts only the
origins it is told about, a release that ships one half without the other breaks sign-in, and the
first release signs every user out once. Today only the Worker ships from the release pipeline; the
backend ships from a separate manual pipeline, and the release gate cannot see CI on squash-merged
commits, so it proceeds without a green run. Reviewers also have no running build to click through
for a pull request, least of all for stacked drafts that never get CI.

## Decision

Three environments, each with its own backend:

- Production: the production backend and the production Worker on the public domain. Released by
  hand only.
- Local: each developer's own backend and the dev server.
- Preview: one build per pull request at a stable per-PR alias of the production Worker, pointed at
  a non-production backend. The target is one isolated backend per pull request. Until the backend
  plan includes those, previews share the dev backend; switching is a credential swap, not a
  redesign.

Production data never reaches a preview, and preview credentials never reach production.

A release is one manual pipeline in a fixed order: gate on the main-branch CI run for the exact
commit, deploy the backend and run migrations, deploy the Worker, smoke test the public domain, then
tag and publish. A failed step stops every later step, so the Worker never ships against a backend
that did not deploy. The gate fails closed: no green main-branch run, no release. Production
credentials sit behind an environment that needs the owner's approval for each run.

Previews build on every push to every open pull request, drafts and stacked layers included. A
preview backend trusts preview origins by pattern; production trusts only its own domain. Preview
mail can never reach a real user. Previews start from a small known data set. When a pull request
closes, its preview is torn down as far as the platform allows and the pull request says so.

Order: fix the release pipeline first, then configure production auth origins, then ship the session
change as its own release, then add previews. Previews need pattern-trusted origins only once the
session lives on the app origin, so building them earlier means doing the auth part twice.

Rejected:

- Automatic release on every merge to main. Production changes stay a deliberate act, which matters
  while a release can sign users out.
- Previews against the production backend. One bad migration or test sign-up lands in real data.
- The platform's isolated branch environments, and one Worker per pull request. All state lives in
  the backend, so the Worker has nothing to isolate; an alias of the existing Worker is the smallest
  thing that gives a URL.
- Keeping the backend and the Worker in separate release pipelines. Nothing then stops one half from
  shipping alone.

## Consequences

- One dispatch ships both halves together, and a backend failure leaves production on the previous
  Worker and the previous backend.
- The first release under this pipeline is the session change, so the one-time sign-out is the first
  thing it proves. A revert does not restore those sessions.
- While previews share the dev backend, every preview push deploys its backend functions over the
  dev backend: the last push wins, a preview can run against another branch's functions, and local
  development on that backend sees the same churn. Isolated preview backends remove this.
- On the shared dev backend, auth builds its own URLs from the dev site address, not the preview
  address. Password sign-in works; anything that needs links back to the preview, such as OAuth
  callbacks or emailed links, does not until each preview gets its own backend and its own exact
  site address.
- Upload CORS matches origins exactly today, so uploads from a preview are blocked until that check
  understands the same patterns auth does.
- Preview URLs are public. Anyone with the URL can reach a preview and its non-production data
  unless access control is added in front.
- Pull requests from forks get no secrets and therefore no preview. Preview jobs must stay on the
  ordinary pull request trigger and never run fork code with secrets.
- An alias can only be set when a version is uploaded, and nothing removes an alias on its own.
  Cleanup deletes the pull request's versions and comments on the pull request; the platform caps
  the number of aliases kept and drops the least recently deployed.
- Seed data needs an idempotent backend function. On the shared dev backend it runs once by hand,
  not on every deploy.
