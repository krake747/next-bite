# ADR-0012: Testing standards

Date: 2026-11-07

Status: Accepted

## Context

Specs couple to internals (hook shapes, call order, class strings), pass regardless of the code
under them, or assert third-party behavior. Each failure mode spends CI time and review attention
while proving nothing about our code.

## Decision

Specs assert observable behavior, never implementation internals: render, interact the way a browser
does, query by text or slot attributes. Every test must be able to fail; a vacuous test is deleted
on sight, no rewrite owed, because removal is the whole fix. Third-party libraries are assumed
correct: specs prove our wiring (our classes land, our attributes render, our schemas accept and
reject what they claim) and stub dependencies at the contract boundary. The single exception is the
className passthrough check, which asserts the styling contract, not a style value.

## Consequences

The review check is one question per rule: does it query rendered output, what breaks it, and does
it import a third-party component under test. Vacuous specs shrink the suite by deletion, which is
the suite getting more honest. Bugs proven to live in a dependency go upstream as an issue with a
minimal repro, never into our suite as a regression test.
