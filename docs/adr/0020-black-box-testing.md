# Black-box testing

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
