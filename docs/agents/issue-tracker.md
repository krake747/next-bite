# Issue tracker: GitHub

Issues and specs live as GitHub issues in `krake747/next-bite`. Ticket shape and lifecycle:
`tickets.md`. Labels: `triage-labels.md`.

## Tooling

Prefer the GitHub MCP server for reads; use `gh` for writes, sub-issues, dependencies, and labels.
Before the first write of a session, `gh repo view --json nameWithOwner` must print
`krake747/next-bite`. Never file into another repo.

- Multi-line bodies go through a heredoc or `--body-file`.
- Sub-issues: `gh issue edit <parent> --add-sub-issue <child>`. Where that is unavailable, put
  `Part of #<parent>` at the top of the child body.
- Blocking: native dependencies (`--add-blocked-by`), else a `Blocked by: #<n>, #<n>` line at the
  top of the child body. A ticket is unblocked when every blocker is closed.
- Audit with `gh issue list --json ...`; reserve `gh issue view` for tickets you will edit.
- Close with an explanation comment, then `gh issue close`.

## Placement

- One primary `area:` label per issue. Cross-layer work splits into sub-issues per layer, each with
  its own area label.
- Long-form context lives in the parent issue, durable decisions in `docs/adr/`, and files,
  commands, and code rules in repo docs. One fact lives in one place; link across.

## Comment style

Open with one or two plain sentences, then bullets for the evidence. Short lines, one idea each,
about twenty words max. If a rule makes a sentence worse, leave the sentence alone.

## Pull requests as a triage surface

**PRs as a request surface: yes.** External PRs are feature requests and bug reports. Triage them
with the same labels and states: confirm they target `main` and pass the PR gate, link the issue
with `Fixes #<n>`, and request changes or close with a comment, never silently.

## When a skill says "publish to the issue tracker"

Create a GitHub issue in `krake747/next-bite`.

## When a skill says "fetch the relevant ticket"

`gh issue view <number> --json number,title,body,labels,comments`.
