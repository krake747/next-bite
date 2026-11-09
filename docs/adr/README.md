# Architecture Decision Records

Ordered by architectural impact, highest first. Numbers are frozen: never renumber, never reuse.

## When to write one

Write an ADR for a durable choice with a rejected option. It answers why the code is this way.
Record durable choices only. Keep dependency timing and version notes out.

## How

Copy `_template.md` to `NNNN-kebab-case-title.md`. Use the next free number. Set Date on the day you
write it. Status defaults to Accepted.

## Lifecycle

Move status from Accepted to Deprecated or Superseded. A new ADR may link back to the one it
replaces. Leave the old file unchanged except its Status line.

## Where

Principles live in the ADR. Mechanics live in `CODING_STANDARDS.md` and repo docs.

## Review

Review the ADR in its PR. Keep the Decision section conceptual: filenames, key names, literal
values, and counts of things that change belong in code and repo docs, not in ADR bodies.
