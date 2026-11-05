# Agent contract

Read this when you publish, work, close, or report on tickets. It defines proposal, takeover, close,
and status rules.

Humans own prod calls; agents own work inside tickets. See `non-negotiables.md` for the prod list.

## Create work

- Show the proposal inline: titles, bodies, relations, and placement.
- Start new tickets with `needs-triage`. Use `ready-for-agent` only when fully specified.
- Create agent subtasks at takeover, not before.
- Skip the plan doc for obvious one or two file changes; say so and stop.
- Link both ways: create the parent first, create subs with `Part of #<parent>` lines, then list
  each sub link in the parent Scope section. Ticket shape lives in `ticket-anatomy.md`.
- Verify every write with a fresh read: re-fetch each created or edited object and diff it against
  the proposal. Done when all diffs match.

Proposal template (one block per ticket, using `ticket-anatomy.md` fields):

```text
Title: plain task language, verb first
Goal: one sentence outcome
Placement: milestone if any, plus area label
Relations: blocks, blocked by, related (existing relations only)
Agents: branch plus takeover notes
```

Parents use Context plus linked Scope plus Acceptance instead of Work plus Verify.

## Work a ticket

Progress checklist (keep this order unless trivial; takeover, start, and done never move):

1. Takeover: start from the ticket plus its parent. Done when the goal and scope are quoted or
   linked in a comment. Resuming multi-session work, open with a capsule: up to five state lines,
   threads with status tags (merged, open, in-flight, verified-uncommitted, reverted, planned),
   recurring problems including reverted fixes with reasons, and the single next move. Verify live
   PR and branch state at pickup; never trust stale chat claims.
2. Start: comment that work started. Done when the start is visible. Report and stop on any
   working-tree change you did not author before branching.
3. Evidence: record progress as comments with command output, not claims. Done when each claim links
   output. Paste failing and passing runs verbatim for fixes; verification means running the
   behavior, not rereading the diff. Run builds with a long timeout; use fixed `gh pr view --json`
   fields including `headRefOid`.
4. Branch: put the issue number in the branch name. Name manual branches `<type>/NNN-short-slug`
   using the commit types in `AGENTS.md`. Done when the branch name carries the number.
5. Close pattern: add a magic word plus number in the PR description to close on merge. Default to
   `Fixes #123` so merge closes the ticket. Use `Refs` or `Part of` for non closing links. Create or
   edit the body with real newlines, never inline `\n` escapes; read the body back and check for
   literal backslashes. Done when the PR description carries the intended pattern and renders clean.
6. ID hygiene: cite numbers only from tool output, never from memory. Magic words in PR comments do
   not link. Done when every cited number traces to tool output.
7. Tip check before rebase or force push: run `git fetch origin`, then run `git status -sb`, then
   compare your tip with the PR head tip from `gh pr view --json headRefOid`. Stop and report if
   they diverge. Repeat after every fetch until the comparison stays clean.
8. Done: close only with a green gate plus a closing comment.

## Close a ticket

- Parent issues close when all sub-issues are done and acceptance holds. Enumerate children through
  the sub-issue linkage, never the scope text: scope lists go stale when children land later, and
  closing with an open child forces a reopen.
- Confirm merge state with `gh pr view`. List endpoints report merged flags unreliably; a wrong flag
  voids the close check above.
- Closing removes working role labels (see `triage-labels.md`). `wontfix` stays as the close reason.
  Done tickets carry no open work roles.
- When a PR merges or closes, delete its branch locally and remotely.
- A merged PR deletes its branch. Cut follow-up work from a fresh `main` branch, never the stale
  local branch, or the new PR re-carries already-merged commits.

## Report status

- State health plus what changed, risks, and next steps.
- Name tickets in words and link once at the end.
- Keep project updates to two or three sentences. Link the parent ticket only; subs stay reachable
  through it.
- Change health only when the forecast changes.

Status template:

```text
Health: on track, at risk, or off track
Changed: what moved since last report
Risks: what could slip, with owner
Next: immediate steps
Tickets: names in words, link once at the end
```
