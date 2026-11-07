# Coding standards

Read this during review, not implementation. Mechanical rules live with their enforcers (`AGENTS.md`
names each rule and what runs it); this file holds judgement calls only. Every rule below states how
the reviewer checks it.

## Primitives compose with the framework, never import it

`src/ui/` has no dependency on TanStack or any app framework. A primitive that needs a router link
takes a `render` prop through Base UI `useRender`, and the call site injects the framework element.
`Button render={<Link to="/signup" viewTransition />}` is the model; `TextLink` follows it. Check:
`grep -rn "@tanstack" src/ui` returns nothing.

## Component state is visible as data attributes

Boolean and enum state that styling, tests, or assistive tech may need renders as `data-*`
attributes. Where we own the element, pass it through `useRender` `state:` and let Base UI convert
it (`state: { slot: "text-link" }` renders `data-slot="text-link"`). Where a Base UI component owns
the element, match its convention: boolean true renders as the empty string, false omits the
attribute. Phosphor icons render no accessible name unless `alt` is set, so decorative icons carry
no `alt` prop; only meaningful icons get accessible names, on the parent element. Check: the browser
spec queries the attribute for both states.

## Prop types stay flat

Prefer `React.ComponentProps<"div">` and `useRender.ComponentProps<"a">` over hand-built
intersections. Omit only props you genuinely narrow or forbid: a required `onClick`, or withholding
Base UI's `render` passthrough. Never omit `className` or `children` just to re-add them with
identical types. Destructure `children` explicitly instead of letting it ride inside `...props`, so
the render output names what it renders. Name the passthrough spread `...props`, never `...rest`.
Check in review: every `Omit` names a prop whose type or presence differs from the source.

## Every prop has a caller, extraction waits for the third copy

A prop no call site passes gets deleted, not documented. A shared component gets extracted when
near-identical JSX exists in three places, not one: the single confirm dialog stays local to its
caller. Check: grep the prop name; zero production call sites means removal.

## Style: owned readonly types

Owned types carry `readonly` modifiers and `ReadonlyArray<T>`; unowned or inline shapes wrap at the
use site with `Readonly<>`. Inline `export` and `use()` are lint-enforced (see `AGENTS.md`). Check
in review.

## Tests assert behavior, not internals

A test must fail when the behavior breaks and pass when only internals move. Tests that cannot fail
get deleted; tests coupled to hook shapes or call order get rewritten against rendered output and
observable effects. Tiers, placement, and query conventions are owned by `docs/agents/testing.md`;
this rule is the bar for what a test proves. Check: describe what breaks the test; "nothing" means
deletion.

## New Convex access lands in grouped domain modules

`src/core/hooks.ts` keeps its existing one-line endpoint wrappers for compatibility, but no new ones
get added there. A new Convex endpoint gets a method on the module that owns the domain workflow
(session, restaurants, social, groups, plans), so endpoint moves stay local to one module instead of
scattering across call sites. Check in review: a new `useConvexMutation(api.…)` alias in
`src/core/hooks.ts` without a domain workflow behind it.

## Absent UI state is a status union

Error states use `FormError` (`clear` / `error`) from `@core/outcome`; other absent values use a
discriminated union (`Viewer`, `InviteLink`) rather than `| null`. `null` stays for React
render-nothing, refs, DOM interop, and external API shapes. Check in review: a new nullable
`useState` whose value reaches rendered output without narrowing through a union.

## Fallible steps report booleans, never throw for control flow

A fallible step resolves a boolean and records the error where the UI reads it; callers branch on
the result instead of catching. A `catch` that maps the error into rendered state (`FormError`,
`SubmitOutcome`) stays; a `catch` whose body only swallows or returns gets deleted in favor of a
boolean result. Throwing stays for genuinely exceptional paths such as backend validators. Check in
review: a new `catch { return }` or `.catch(() => {})` with no state update.
