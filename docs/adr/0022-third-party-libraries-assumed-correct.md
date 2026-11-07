# Third-party libraries are assumed correct

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
