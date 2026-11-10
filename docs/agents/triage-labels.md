# Triage labels

## Roles

Skill role names equal the label strings. Closing removes the working role; `wontfix` stays as the
close reason.

- `needs-triage`: the maintainer evaluates the issue.
- `needs-info`: waiting for the reporter to add detail.
- `ready-for-agent`: fully specified, ready for work.
- `ready-for-human`: needs a human to implement.
- `wontfix`: close with no action.

## Types

One per issue, preset by the issue template and confirmed at triage.

- `bug`: broken behavior.
- `feature`: new capability, or better product behavior (Feature template).
- `improvement`: better process, docs, or codebase (Tech debt template).
- `spike`: time-boxed investigation; the comment is the deliverable.

## Areas

One primary area per issue, kept on closed tickets. Add a second only when the change lands in two
layers.

- `area:ui`: routes and features.
- `area:convex`: the backend.
- `area:platform`: Cloudflare, CI, and deploys.
- `area:docs`: repo docs, ADRs, and agent docs.
- `area:design`: the design system, registry, and tokens.

## Workflow markers

`on-hold`: paused by owner decision. Only a human adds or lifts it; triage and close rules never
touch it.
