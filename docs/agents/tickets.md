# Tickets

Read this when you create, work, close, or report on an issue. Bodies start from the templates in
`.github/ISSUE_TEMPLATE/`: Feature, Bug, and Tech debt subs carry the work, a Parent maps over its
subs, and a Spike answers a question.

## Shape

- **Title:** plain task language, verb first, such as `Fix signup redirect loop`.
- **Sub sections,** in order as `##` headings: Problem (optional: who hurts and why), Goal (one
  sentence: the outcome plus a checkable finish), Why (why now), Work (one item per bullet; stable
  anchors such as module roles, not exact paths; sketch new interfaces), Verify (`pnpm check:full`
  plus what CI cannot cover; docs-only notes the skip), Out of scope (only when something is
  excluded), Agents (branch plus takeover notes).
- **Parent sections:** Context (narrative plus locked decisions; link ADRs), Goal, Scope (one sub
  link per line, no prose, never copied bodies), Acceptance (outcome checks a stranger can run),
  Agents.
- **Markdown:** plain bullets, never checklists (ticking spams activity); numbered lists only for
  repro steps; code spans for paths, commands, and ids; every issue reference as `#<n>` without
  repeating its title.
- No `TBD` and no `Notes` catch-all. Define acronyms on first use. Durable decisions go in
  `docs/adr/`. Investigation records findings as comments; a fix gets its own ticket.
- **Relations:** link existing ones only, never restated in prose. Children carry
  `Part of #<parent>`; blocking follows `issue-tracker.md`.

## Create

- Show the proposal inline first: titles, bodies, relations, and labels.
- New tickets start with `needs-triage`; use `ready-for-agent` only when fully specified. Create
  agent subtasks at takeover, not before. Skip the plan for obvious one or two file changes.
- Create the parent first, then subs with `Part of #<parent>`, then link each sub from the parent's
  Scope.
- Re-read every created or edited object and diff it against the proposal.

## Work

1. **Takeover:** quote or link the goal and scope in a comment. Check live PR and branch state;
   never trust stale chat claims. When resuming multi-session work, open with a resume note: up to
   five state lines, threads tagged merged, open, in-flight, verified-uncommitted, reverted, or
   planned, recurring problems including reverted fixes and why, and the single next move.
2. **Start:** comment that work started. Stop and report on any working-tree change you did not
   author.
3. **Evidence:** comments carry command output, not claims. Fixes paste the failing and the passing
   run. Verification runs the behavior; rereading the diff is not verification.
4. **Branch:** `<type>/NNN-short-slug`, carrying the issue number.
5. **PR:** the body carries `Fixes #<n>` to close on merge, or `Refs #<n>` / `Part of #<n>`. Write
   real newlines, never literal `\n`. Magic words in PR comments do not link. Cite numbers only from
   tool output.
6. **Done:** close only with a green gate plus a closing comment.

## Close

- A parent closes when every sub-issue, read from the sub-issue linkage rather than the Scope text,
  is closed and acceptance holds.
- Confirm merge state with `gh pr view`; list endpoints report merged flags unreliably.
- Closing removes working role labels; `wontfix` stays as the reason.
- Delete merged branches. Cut follow-ups from a fresh `main`, never the stale branch.

## Report status

Health plus what changed, risks, and next steps, in two or three sentences. Name tickets in words
and link the parent once at the end. Change health only when the forecast changes.

```text
Health: on track, at risk, or off track
Changed: what moved since last report
Risks: what could slip, with owner
Next: immediate steps
Tickets: names in words, link once at the end
```
