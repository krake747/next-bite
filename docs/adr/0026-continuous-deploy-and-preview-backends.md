# ADR-0026: Continuous deploy, per pull request backends, and server rendering

Date: 2026-11-10

Status: Accepted

## Context

Supersedes ADR-0006, ADR-0014, ADR-0024, and the asset-only hosting shape in ADR-0013.

The app has two deployables that must agree: the backend and the Worker. A hand-dispatched release
let one half ship without the other, and a release gate that could not see main-branch CI proceeded
without a green run. Reviewers want a running build per pull request, and a backend shared between
previews would let branches overwrite each other's functions and send auth links to the wrong host.
The shell record promised that server rendering would get its own record once enabled; public pages
now render on the server.

## Decision

Production deploys on every green main-branch CI run, in a fixed order: backend functions, schema,
and migrations, then the Worker, then a smoke test on the public domain. A failed step stops every
later step, so the Worker never ships against a backend that did not deploy. A manual redeploy of
the current main stays available. Until the production backend cutover, production reads the dev
backend; the cutover swaps credentials and environment, not the pipeline.

Every pull request into main gets its own preview backend, with its own data, identity, and exact
site address, plus a per pull request alias of the production Worker. Each push redeploys both and
runs an idempotent seed of a small known data set; closing the pull request deletes both. A stacked
layer gets its preview on the first push after it targets main. Forks get none, and preview jobs
never run fork code with secrets. Preview mail never reaches a real user, and production data never
reaches a preview.

Routes render on the server, and the Worker runs the framework server entry in front of the static
assets. The server resolves the session only to guard routes; private data loads on the client, so
server HTML never carries a private record.

Rejected:

- A manual release with version tags. A green main is the gate, and a manual step let the backend
  and the Worker drift apart.
- Previews sharing the dev backend. Last push wins across branches, and auth links point at the
  wrong host.
- Previews for every base branch. Each stacked layer would hold its own backend for a diff that is
  still moving.
- Client-only rendering. Public pages need metadata and a first paint without the client bundle.

## Consequences

- Every merge ships. Main must stay deployable, and a rollback is a new merge.
- Until the cutover, local development pushes functions to the backend production reads, and the
  next deploy overwrites them.
- Preview URLs are public unless access control is added in front.
- Preview backends expire on the platform's schedule; the next push recreates and reseeds them.
- An alias can only be set at upload, so cleanup deletes the pull request's versions.
- Server and first client render must agree on auth state, or hydration breaks.
