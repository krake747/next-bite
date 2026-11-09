# Issue tracker: GitHub

Read this when you create, read, or close a GitHub issue. It names the repo plus when to load shape,
placement, flow, and label docs.

Issues and specs for this repo live as GitHub issues in `krake747/next-bite`.

## Tooling: MCP first, `gh` fallback

Prefer the GitHub MCP server (`github` tools) for read operations. When it lacks the operation
(writes, sub-issues, dependencies), fall back to the `gh` CLI.

Before the first write of a session, confirm the target with `gh repo view --json nameWithOwner`. It
must print `krake747/next-bite`. Never file into another repo.

## Conventions (`gh` fallback)

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line
  bodies. Body shape follows `ticket-anatomy.md`; load only the template you need from `templates/`.
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
  `gh issue close <number>`. Close rules live in `agent-contract.md`.

## Comment and update style

Owner house style: open with one or two plain sentences, then bullet points for the evidence. Short
lines, one idea each, no filler. Prefer plain verbs, one instruction per sentence, about twenty
words max. If a rule makes a sentence worse, leave the sentence alone.

## Write specs in parents

Long-form context lives in the parent issue body per `ticket-anatomy.md`. Durable technical
decisions live in `docs/adr/`, never in the issue. One fact lives in one place. Link across.

Domicile rule: repo docs own files, commands, schemas, env names, and code rules. Issues own product
why and what. Link across.

## Read cheaply

Audit with `gh issue list` plus `--json` fields. Reserve `gh issue view` for tickets you will edit.

## Pull requests as a triage surface

**PRs as a request surface: yes.** This repo is open source; external PRs are feature requests and
bug reports. Triage them through the same labels and states as issues.

- Confirm the PR targets `main` and passes the PR gate (`.github/workflows/pr.yml`).
- Apply role, type, and area labels per `triage-labels.md`.
- Link the PR to its issue with `Fixes #<n>` (closes on merge), `Refs #<n>`, or `Part of #<n>`.
- Request changes or close with an explanation comment; never close silently.

## When a skill says "publish to the issue tracker"

Create a GitHub issue in `krake747/next-bite`.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.
