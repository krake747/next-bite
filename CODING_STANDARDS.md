# Coding standards

Read this during review, not implementation. Mechanical rules live with their enforcers (`AGENTS.md`
names each rule and what runs it); this file holds judgement calls only. Every rule below states how
the reviewer checks it.

## Module files read module.usecase

A module file names the module first, then the usecase after a dot: `auth.sdk`, `convex.options`,
`image.utils`. One dot, two segments; tiers keep their own suffixes (`auth.store.spec`). Component
files keep their single kebab name (`comment-list`, `pending-button`): dots mark module splits, not
word breaks. Check: a new file with two or more dashes that splits a module from its usecase.

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

## Prop types compose, never omit to re-add

A primitive's props are Base UI props plus CVA variant props plus whatever the wrapper adds,
composed with `&`. Do not `Omit` `render` or `children` just to redeclare them; extend the Base type
as-is and add your own props alongside it:

```ts
type DialogPanelProps = VariantProps<typeof panel> & React.ComponentProps<typeof BaseDialog.Popup>
```

The only `Omit` that belongs in `ui/` withholds a prop entirely, such as `DialogAction` narrowing
`render` to element-or-children because it cannot honor render callbacks. What stays enforced:
destructure `children` explicitly instead of letting it ride inside `...props`, so the render output
names what it renders; name the passthrough spread `...props`, never `...rest`; use `useRender` for
anything accepting a `render` prop. Base prop shapes live in Base UI's type definitions. Check in
review: `children` is destructured and rendered; the spread is named `...props`; `render` goes
through `useRender`.

## Every prop has a caller, extraction waits for the third copy

A prop no call site passes gets deleted, not documented. A shared component gets extracted when
near-identical JSX exists in three places, not one: the single confirm dialog stays local to its
caller. Check: grep the prop name; zero production call sites means removal.

## Style: owned readonly types

Owned types carry `readonly` modifiers and `ReadonlyArray<T>`; unowned or inline shapes wrap at the
use site with `Readonly<>`. Check in review.

## Coupled lifecycles have explicit states and owners

When related flags or fields jointly control a workflow, model its meaningful states and transitions
explicitly, using a discriminated union or another small, centralized model. Keep independent
toggles simple. No state-machine library or blanket rewrite is required.

Name who owns each async operation and its results. A stale completion must not update a newer
operation, draft, or session. Define success, failure, retry, cancel, and reset paths, including
work that can finish after unmount.

Canceling a request or timing out does not prove the server did not commit. For uncertain persisted
operations, retain the operation identity and reconcile the result before retrying or cleaning up
resources. Retries must be idempotent; cleanup must not delete committed or attached resources.

Check: trace the reachable transitions and their guards, then read behavior tests for failure,
retry, cancellation, reset, and late completion where relevant. Include uncertain server outcomes
when persistence is involved. Tests should prove observable outcomes, not the chosen state
representation.

## Tests assert behavior, not internals

A test must fail when the behavior breaks and pass when only internals move. Tests that cannot fail
get deleted; tests coupled to hook shapes or call order get rewritten against rendered output and
observable effects. Tiers, placement, and query conventions are owned by `docs/testing.md`; this
rule is the bar for what a test proves. Check: describe what breaks the test; "nothing" means
deletion.

## Spec doubles track the prod function

A spec that re-implements a production function cites the source it mirrors; prefer importing the
prod function with injected seams over a hand-rolled copy. A mirror with no citation drifts when
prod moves. Check: a hand-rolled mock of a function that exists in `src/` names its source.

## Convex access lives in grouped domain modules

Convex endpoints are called only from the `src/core/<domain>.ts` module that owns the workflow.
Routes, features, and patterns import those modules directly; there is no shared hooks barrel. A new
Convex endpoint gets a method on the owning module so endpoint moves stay local instead of
scattering across call sites. Check in review: a new `useConvexMutation(api.…)` alias outside a
domain module.

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
