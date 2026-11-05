# Triage labels

Read this when you create, triage, label, or close an issue. It defines role, type, area, and
workflow-marker labels.

| Skill role        | Tracker label     | Meaning                             |
| ----------------- | ----------------- | ----------------------------------- |
| `needs-triage`    | `needs-triage`    | Maintainer evaluates the issue      |
| `needs-info`      | `needs-info`      | Wait for the reporter to add detail |
| `ready-for-agent` | `ready-for-agent` | Fully specified, ready for work     |
| `ready-for-human` | `ready-for-human` | Needs human implementation          |
| `wontfix`         | `wontfix`         | Close with no action                |

The skills speak in terms of the five canonical triage roles above. When a skill mentions a role
(e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

## Type labels

Independent dimension from roles. One type label per issue max, set at triage. Typed templates
preset it; triage confirms it. Closing a ticket removes its working role label; `wontfix` stays as
the close reason.

| Tracker label | Meaning                                                  |
| ------------- | -------------------------------------------------------- |
| `bug`         | Broken behavior                                          |
| `feature`     | New capability                                           |
| `improvement` | Better existing behavior, process, or docs               |
| `spike`       | Time boxed investigation; the comment is the deliverable |

Use the Feature template for `improvement` on product behavior; the Tech debt template for process,
docs, and codebase improvements (bodies in `ticket-anatomy.md` templates).

## Area labels

Independent dimension from roles and types, and kept on closed tickets. One primary area label per
issue; add a second only when the change lands in two layers. Values name the layer, not a person.

| Tracker label   | Meaning                                     |
| --------------- | ------------------------------------------- |
| `area:ui`       | Routes, features, `src/`                    |
| `area:convex`   | Convex backend (schema, queries, mutations) |
| `area:platform` | Shared ground (Cloudflare, CI, release)     |
| `area:docs`     | Repo docs, ADRs, agent docs                 |
| `area:design`   | Design system (`src/ui`, registry, tokens)  |

## Workflow markers

Independent dimension from roles, types, and areas. Never applied or removed by triage or close
rules; only a human adds or lifts them.

| Tracker label | Meaning                                                  |
| ------------- | -------------------------------------------------------- |
| `on-hold`     | Paused by owner decision; reopens only on a human say-so |
