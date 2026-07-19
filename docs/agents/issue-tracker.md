# Issue tracker: Linear

Issues and PRDs for this repo live in Linear.

- **Workspace**: `krake`
- **Project**: "next bite" (`https://linear.app/krake/project/next-bite-74b300bef83f/overview`)
- **Tool**: Linear's official [MCP server](https://linear.app/docs/mcp) at
  `https://mcp.linear.app/mcp`, configured as a remote MCP in opencode's config (`opencode.jsonc`).

## Conventions

Agents interact with Linear through the `linear` MCP server, which exposes tools for managing
issues, projects, and teams. The server is accessed by referencing `linear` in prompts or using its
tools directly.

- **Create an issue**: Use `linear_save_issue` (omit `id` to create). Always pass `team: "Krake"`
  and `project: "Next Bite"`.
- **Read an issue**: Use `linear_get_issue` by identifier (e.g. `KRA-44`).
- **List issues**: Use `linear_list_issues` with filters (`state`, `project`, `includeArchived`).
- **Comment on an issue**: Use `linear_save_comment`.
- **Apply / remove labels**: Use `linear_save_issue` with the `labels` array, or
  `linear_create_issue_label` for new labels.
- **Close / cancel**: There is no delete. Set `state: "Canceled"` to cancel, or a completed state
  (e.g. `Done`) to close. Available statuses on the Krake team: Backlog, Todo, In Progress, In
  Review, Done, Canceled, Duplicate.
- **Sub-issues**: Set `parentId` on `linear_save_issue` to create a child relationship.
- **Blocking**: Use `blockedBy` (array of issue IDs) and `blocks` on `linear_save_issue` for native
  dependency edges rendered in Linear's UI.
- **Recommended hierarchy**: `Project > Milestone > [Spec A, Spec B, ...] > Task (sub-issue)`. A
  milestone can contain multiple parent issues (specs, wayfinding maps, etc.), each with their own
  sub-issues.
- **Milestones**: Set `milestone` by name on `linear_save_issue`. Create/update milestones via
  `linear_save_milestone`. Milestones live under a project.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature
requests; `/triage` reads this flag.)_

When set to `yes`, GitHub PRs are triaged through the same labels and states as issues, using the
`gh` CLI for PR operations. Linear handles issues only; PRs remain in GitHub.

## When a skill says "publish to the issue tracker"

Create a Linear issue via the MCP server in the "next bite" project.

## When a skill says "fetch the relevant ticket"

Use the MCP server to look up the issue by identifier or search.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single Linear issue with **child** issues as tickets.

- **Map**: a single issue in the "next bite" project labelled `wayfinder:map`, holding the Notes /
  Decisions-so-far / Fog body. The map may alternatively live as a **milestone description** if the
  work is better expressed as a milestone rather than an issue.
- **Child ticket**: a Linear issue created as a **sub-issue** of the map via the `parentId`
  parameter on `linear_save_issue`. Labels: `wayfinder:<type>`
  (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving
  dev.
- **Blocking**: use Linear's native `blockedBy` parameter on `linear_save_issue` (e.g.
  `blockedBy: ["KRA-46"]`). This renders dependency lines in Linear's board and list views. A ticket
  is unblocked when every blocker is closed.
- **Frontier query**: list the map's open sub-issues, drop any with an open blocker or an assignee;
  first in map order wins.
- **Claim**: assign the issue to yourself via the MCP server — the session's first write.
- **Resolve**: comment the answer on the issue, then close it, then append a context pointer (gist +
  link) to the map's Decisions-so-far.
- **Close cancelled/irrelevant issues**: use the Canceled status (`state: "Canceled"`). There is no
  permanent deletion via the MCP server.

## Tracer-bullet tickets

Used by `/to-tickets`. A **spec** (labelled `ready-for-agent`) is the parent issue, with
**tracer-bullet tickets** as sub-issues via `parentId`.

- **Spec**: a Linear issue in the "next bite" project labelled `ready-for-agent`, containing the
  problem statement, user stories, implementation decisions, testing decisions, and out of scope.
- **Ticket**: a Linear sub-issue of the spec (via `parentId`). Each ticket is a vertical slice with
  "What to build", acceptance criteria, and native `blockedBy` edges. Labelled `ready-for-agent`.
- **Blocking**: use Linear's native `blockedBy` parameter. Create tickets in dependency order
  (blockers first) so later tickets can reference real issue IDs.
- **Assignee and milestone**: set `assignee` and `milestone` at creation time. All tickets in the
  same project and milestone as the spec.
- **Priority**: spec gets higher priority (e.g. High) than tickets (e.g. Medium).
