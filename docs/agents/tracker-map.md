# Tracker map

Read this when you pick a milestone or label, or before you close an issue. It maps GitHub levels,
placement, and limits. For which command to call, read `issue-tracker.md`.

Levels from small to large: issues carry one task with a defined outcome; sub-issues split a parent
outcome into reviewable pieces. Milestones are stages or releases grouping issues with a start and
an end. Labels cut across levels with `area:` naming the layer. Pull requests close issues on merge.
There are no Linear projects, cycles, initiatives, views, or Documents in this repo.

## Pick a milestone

Milestones group issues around an outcome or release. Name the result, never a layer. Cover the
layer with an `area:` label (see `triage-labels.md`), not with the milestone.

Keep milestone text short, no links.

## Use sub-issues

Split work into sub-issues so each piece is independently reviewable. The parent holds the spec and
maps over its children (see `ticket-anatomy.md`). Cross layer work splits into sub-issues per layer,
each carrying its own `area:` label.

## Naming rules

Label values name the layer or role, not a person. Milestone names say the outcome. If a name would
never close, it is not a milestone.

## Follow tracker rules

- One milestone and one primary `area:` label per issue.
- No floating spec docs. Long-form context lives in the parent issue body; durable decisions live in
  `docs/adr/`.

## Tracker limits

Sub-issues and dependencies need `gh` 2.94+ or the web UI. The GitHub MCP server covers reads and
basic writes only; use the `gh` CLI for sub-issues, dependencies, and label edits (see
`issue-tracker.md`).
