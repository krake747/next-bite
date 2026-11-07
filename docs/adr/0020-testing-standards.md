# Testing standards

Three rules own what a spec may assert. All three address reviewers; all three are live.

## Black-box testing

Specs assert observable behavior, never implementation internals. A browser spec renders the
component, interacts the way a browser does, and queries by text content or `data-slot` attributes,
not CSS classes or hook shapes. When a test couples to internals (hook return shapes, call order,
private helpers), the fix rewrites the test against rendered output, never the other direction.

**Considered Options**

- **White-box tests that pin internals**: Rejected because every refactor breaks them without a
  behavior change, which trains the team to update tests instead of questioning the diff.
- **Behavior-only specs**: Accepted. The test survives refactors (prop objects, hook gating,
  `useRender` conversions) and fails only when the user-visible outcome changes.

**Consequences**

- New specs query rendered output and observable effects; reviewers reject specs that assert hook
  shapes, call order, or class strings as behavior. The single exception is the `className`
  passthrough check (`expect(el.className).toContain("custom-class")`): wrappers own styling and
  call sites may only pass layout classes, so asserting the merge lands is asserting the
  `shadcn/no-restyle` contract, not a style value. Prefer `data-slot`/`dataset` for everything else.
- `docs/agents/testing.md` owns tiers and query conventions; `CODING_STANDARDS.md` owns the bar a
  test must clear.

## No tautological tests

Every test must be able to fail. A test that passes regardless of the code under it is worse than no
test: it spends CI time and review attention while proving nothing, and its presence implies
coverage that does not exist.

**Considered Options**

- **Keep can't-fail tests as documentation**: Rejected because documentation that executes pretends
  to verify. Prose belongs in docs, not in a passing suite.
- **Delete on sight, no rewrite owed**: Accepted. A vacuous test carries no behavior worth
  preserving, so removal is the whole fix.

**Consequences**

- The review check is a single question: describe what breaks this test. "Nothing" means deletion in
  the same change.
- Deletion needs no replacement test and no ticket; the suite shrinking here is the suite getting
  more honest.

## Third-party libraries are assumed correct

Specs never test Base UI, TanStack, valibot, or any other dependency. The library's own suite proves
its behavior; ours proves our wiring: our classes land, our attributes render, our schemas accept
and reject the shapes we claim. When a spec needs a library element (a router link, a map event), it
stands in a plain element or a minimal stub shaped to the contract, never the real component.

**Considered Options**

- **Test through the real dependency**: Rejected because failures then blame either side, the suite
  inherits the dependency's setup cost, and upgrades break specs without behavior changes.
- **Stub at the contract boundary**: Accepted. `TextLink` specs render a plain anchor through the
  `render` prop; map event specs shape `{ placePrediction: { toPlace } }` by hand. The suite runs
  fast and fails only on our code.

**Consequences**

- New specs import no third-party component under test; reviewers reject specs that assert library
  internals (class merging, subscription mechanics, validation plumbing).
- Bugs proven to live in a dependency go upstream as an issue with a minimal repro, not into our
  suite as a regression test.
