# Architecture Decision Records

Numbers are frozen: never renumber, never reuse. The directory listing is the index. Read the record
for the area you change before you change it.

## Write one

Write an ADR for a durable choice with a rejected option. It answers why the code is this way. Copy
`_template.md` to `NNNN-kebab-case-title.md` with the next free number and today's date, and review
it in its PR. Keep the Decision conceptual: filenames, key names, literal values, versions, and
counts belong in code.

## Lifecycle

Status moves from Accepted to Deprecated, `Superseded by ADR-NNNN`, or
`Superseded in part by ADR-NNNN`. The new record names the one it replaces. Leave the old file
unchanged except its Status line. When a change conflicts with an Accepted record, surface the
conflict instead of silently overriding it.
