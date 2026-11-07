# No tautological tests

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
