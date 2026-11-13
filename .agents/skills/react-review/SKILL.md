---
name: react-review
description: Use when reviewing React components, hooks, or route files for idiomatic React, when the user asks for refactor targets or a React cleanup pass, or types /react-review. Reports composition, colocation, state ownership, and repo-idiom findings ranked by hurt. It reports, it does not fix. External scanner counterpart is react-doctor.
version: "1.0.0"
---

# React Review

A specialized review skill. It does one thing: judge React code against this repo's idioms and report what to refactor, ranked by how much it hurts. It does not build features or fix the code. Point it at a diff, a component, a hook, or a file.

This skill owns structure: composition, colocation, ownership, and idiom. When a finding is visual (spacing, motion, contrast), leave it for a UI review pass. When a finding is a known diagnostic with a scanner recipe, defer to `react-doctor`.

## Operating posture

Review like the engineer who will maintain the file. Code that renders but resists change, hides its data flow, or duplicates what the framework owns is a regression, not a pass. Default to flagging. Approval is earned, not assumed.

## What to review, in priority order

Read the target first, then judge it against these dimensions. The order is the triage order: a broken hook outranks an awkward prop. Expanded checklists with repo examples live in [references/dimensions.md](references/dimensions.md).

1. **Correctness of hooks and rendering**: hooks called unconditionally and in stable order, stable `key` values, no state that duplicates derivable data, effects that clean up async work which can outlive unmount. See `useCopyFeedback`-style timers as the model: ref-held, cleared on retrigger and on unmount.
2. **Composition over configuration**: layout shells take `children`, related pieces compose as compound components, call sites pass layout only. A pile of boolean props that switches between renders is a component begging to be split. Wrappers own styling; call sites never restyle.
3. **Colocation**: logic lives next to its only consumers: helpers beside their single call site, tables beside the rows they render, maps beside the registry they index. A shared module with one importer is a file waiting to be inlined.
4. **State ownership**: props for one level of passing, context (read through `use()`, never `useContext`) when it goes deeper. A component that renders from optional data owns its guard and returns null instead of pushing conditionals to its caller. Each component destructures only what it reads.
5. **Repo idioms**: React Compiler owns memoization, so `useMemo`, `useCallback`, and `React.memo` never appear (ADR-0009). Layout shells type props as `React.ComponentProps<element>`; data carriers keep explicit types. Multi-line event logic lives in named `handle*` functions; single-expression delegation stays inline. Props are `Readonly`, types beat interfaces, and nothing is ever cast.
6. **Dead code**: a prop with zero call sites gets deleted, an unused helper goes with it. Extraction waits for the third copy: the first duplication is a note, the second is a candidate, the third is the refactor.

## Escalation triggers: flag on sight

These are almost always wrong. You do not need to deliberate. Wrong-to-right snippets for each trigger live in [references/triggers.md](references/triggers.md).

- `useMemo`, `useCallback`, or `React.memo`.
- `useContext` (the repo reads context through `use()`).
- An `as` cast or a non-null assertion.
- `Omit` that redeclares props just to re-add them, or a `...rest` spread (the spread is named `...props`).
- `children` riding inside the spread instead of destructured and rendered.
- Multi-line logic inline in `onClick` or JSX instead of a named handler.
- A prop drilled through an intermediary that never reads it (context instead).
- Nullable `useState` whose value reaches render without narrowing through a union.
- A `catch` whose body only swallows, with no state update.

## Output format

Lead with the verdict, then the findings. Do not bury the one thing that matters under ten nits.

- **Verdict**: one line: **Blocked**, **Approve with changes**, or **Ship it**. Blocked means at least one finding breaks hooks, data flow, or the repo lint gate.
- **Blocking**: findings that must be fixed before the code lands. Each: what is wrong, where (`file:line`), why it hurts, and the fix with the repo rule it follows.
- **Should fix**: real structural problems that are not blockers. Same shape.
- **Nits**: small polish, clearly labeled as optional.

Be specific and cite the exact code. "This component is hard to follow" is weak; "this page threads `entry` through four layers that never read it: provide it once through context and let each section read what it needs" is a review. Name the repo rule (an `AGENTS.md` row, a `CODING_STANDARDS.md` section, an ADR) so the fix is grounded, not invented.

## What earns approval

A target ships when hooks are correct, pieces compose instead of configuring, logic sits next to its consumers, state has a clear owner, repo idioms hold, and nothing dead remains. Approval is the absence of findings, not the absence of effort. If you cannot find anything wrong, say so plainly.
