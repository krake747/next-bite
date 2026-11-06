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
attribute. Lucide icons ship hidden from assistive tech by default, so decorative icons carry no
`aria-hidden` prop; only meaningful icons get accessible names, on the parent element. Check: the
browser spec queries the attribute for both states.

## Prop types stay flat

Prefer `React.ComponentProps<"div">` and `useRender.ComponentProps<"a">` over hand-built
intersections. Omit only props you genuinely narrow or forbid: a required `onClick`, or withholding
Base UI's `render` passthrough. Never omit `className` or `children` just to re-add them with
identical types. Destructure `children` explicitly instead of letting it ride inside `...props`, so
the render output names what it renders. Check in review: every `Omit` names a prop whose type or
presence differs from the source.

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
