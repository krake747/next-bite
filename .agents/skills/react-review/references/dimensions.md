# Dimensions reference

Expanded checklists for the triage order in `SKILL.md`. Each dimension lists what to look for, a concrete smell from this repo, and the fix direction.

## 1. Correctness of hooks and rendering

Look for conditional hooks, unstable keys, state that duplicates derivable data, and effects whose async work can outlive unmount.

Smell: a `setTimeout` reset with no cleanup or ref, so a second copy leaves a stale timer that flips feedback back early.

Fix: hold the timer in a ref, clear it on retrigger, clear it on unmount. The `useCopyFeedback` shape (ref plus effect cleanup plus state update on both paths) is the model.

## 2. Composition over configuration

Look for boolean props that switch between renders, wrappers that get restyled at call sites, and pages that inline every section.

Smell: a page body with a conditional block per section plus the tables inside each block.

Fix: private section components that own their guards and return null; layout shells that take `children`; call sites pass layout only (a `className` for alignment is layout, a restyle is not).

## 3. Colocation

Look for helpers, maps, and row-builders that live far from their only consumer.

Smell: an icon map in a layout file consumed only to render one nav, or a `practiceRows` builder in a route file serving one table module.

Fix: move the logic next to its consumer. A shared module with one importer gets inlined. The exception is genuinely shared reference (tokens, registry data), which stays where every consumer can reach it.

## 4. State ownership

Look for props drilled through intermediaries that never read them, and guards pushed up to callers.

Smell: a page threading `entry` through four section layers so each can pick one field.

Fix: provide once through context, let each consumer destructure only what it reads. One level of passing stays as props; deeper goes through context read with `use()`. Components that render from optional data return null when it is missing.

## 5. Repo idioms

Look for framework-owned work done by hand, element shapes rewritten, and logic hiding in JSX.

Smell: an inline multi-line `onClick` that copies to the clipboard, or a hand-written prop type that repeats an element's props.

Fix: named `handle*` functions for multi-line handlers (single-expression delegation stays inline); `React.ComponentProps<element>` for layout shells with explicit types for data carriers; `Readonly` props; types over interfaces; no casts, fix at the source.

## 6. Dead code

Look for props with zero call sites, helpers with one caller that add no abstraction, and speculative options.

Smell: a copy button duplicated per panel instead of one shared hook, or a variant nobody renders.

Fix: delete what has no caller. Extraction waits for the third copy: note the first duplication, candidate the second, refactor on the third.
