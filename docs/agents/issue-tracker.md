# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues in `krake747/next-bite`.

## Tooling: MCP first, `gh` fallback

Prefer the GitHub MCP server (`github` tools) for read operations. When it lacks the operation
(writes, sub-issues, dependencies), fall back to the `gh` CLI.

Before the first write of a session, confirm the target with `gh repo view --json nameWithOwner`. It
must print `krake747/next-bite`. Never file into another repo.

## Conventions (`gh` fallback)

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line
  bodies.
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments` with
  `--label` and `--state` filters.
- **Make an issue a sub-issue of a parent**: `gh issue edit <parent> --add-sub-issue <child>` (`gh`
  2.94+). Without sub-issues, put `Part of #<parent>` at the top of the child body.
- **Blocking**: GitHub's native issue dependencies where available (`--blocked-by` /
  `--add-blocked-by`); otherwise a `Blocked by: #<n>, #<n>` line at the top of the child body. A
  ticket is unblocked when every blocker is closed.
- **Comment on an issue**: `gh issue comment <number> --body "..."`.
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`.
  Label vocabulary lives in `triage-labels.md`.
- **Close**: post the explanation with `gh issue comment <number> --body "..."`, then
  `gh issue close <number>`.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature
requests; `/triage` reads this flag.)_

When set to `yes`, GitHub PRs are triaged through the same labels and states as issues, using the
`gh` CLI for PR operations.

## When a skill says "publish to the issue tracker"

Create a GitHub issue in `krake747/next-bite`.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.
