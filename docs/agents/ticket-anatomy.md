# Ticket anatomy

Read this when you create or edit an issue. It defines the shared section vocabulary plus markdown
rules. For typed shapes, load only the template you need from `templates/`: Feature, Bug, and Tech
debt subs carry the work, the Parent maps over its subs, and Spikes answer questions.

## Shape a sub

Shared vocabulary. Typed templates select from it and add their own sections (see Templates below).

Sections in order, with `##` headings:

- **Title:** plain task language, verb first. Example: `Fix signup redirect loop`.
- **Problem:** one sentence of user visible pain. Optional; use when the pain is not obvious. Name
  who experiences it and why it matters, so the issue never reads as bare build orders.
- **Goal:** one sentence. State the outcome plus a checkable finish, never a step list.
- **Why:** one sentence. State why this matters now. For debt-shaped work this is the Why-now:
  without it the issue rots in the backlog.
- **Work:** bullets, one item per bullet. Name stable anchors, not exact paths. For composition
  tickets, sketch the new interface signature so implementers do not guess it.
- **Verify:** `pnpm check:full` must be green, plus any checks CI cannot cover (live env, demo).
  Docs-only changes note the skip instead.
- **Out of scope:** optional. Name what this ticket does not do, only when an exclusion exists. Omit
  the section otherwise.
- **Agents:** branch plus takeover notes per `agent-contract.md`.

## Shape a parent

- **Context:** narrative plus locked decisions. More context than any sub.
- **Goal:** one sentence. State the outcome.
- **Scope:** the rich sub links alone, one per line. Each line is `Part of #<parent>` carried by the
  child, or a `#<child>` link here; append no prose. Never copy sub bodies.
- **Acceptance:** outcome level checks (live env, demo, tests green).
- **Out of scope:** optional, as for subs. Omit the section when nothing is excluded.
- **Agents:** work happens in the subs; close rule in `agent-contract.md`.

## Format with markdown

GitHub renders markdown. Use it so issues scan:

- `##` headings per section, in anatomy order.
- Bullets with one item per line and a blank line around the list. Numbered lists only for
  reproduction steps. Plain bullets everywhere, including acceptance criteria: never checklists
  (ticking spams activity). Done status signals completion.
- Code spans for paths, commands, ids, and literals.
- Every issue reference uses `#<n>` or a full issue URL, in bullets and prose, so status stays live.
  Never repeat the title after the link.
- Point to stable anchors (module roles, zone names, pinned API names), not exact file paths. Paths
  drift; confirm the tree at takeover.

## Follow ticket rules

- Place each issue per `tracker-map.md` and `triage-labels.md`. Split work into sub-issues.
- Declare dependencies with relation lines. Link existing relations only, and never restate a
  relation in prose. Blocking uses native dependencies where available, else a
  `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every
  blocker is closed.
- Parent issues link sub-issues, never copy their bodies.
- Reject placeholder text such as `TBD`.
- Define each acronym on first use and keep wording specific and measurable.
- Write acceptance so a stranger can check it without asking you.
- Investigation-shaped work records findings as comments; a fix needs its own ticket or an explicit
  scope note.
- No `Notes` catch-all sections. Considerations go in Work, durable decisions go in `docs/adr/`.

## Templates

Bodies for issue creation live in `templates/` so they stay reviewable in git. Load only the
template you need. Each typed template presets its type label; triage confirms it. The Parent holds
the spec and maps over typed subs (see Shape a parent above).

`Out of scope` is optional in every template: add the section only when an exclusion exists (see
Shape a sub above).

Every template ends with an `Agents` section built from the shared footer; expand it when you paste
the body into the issue.
