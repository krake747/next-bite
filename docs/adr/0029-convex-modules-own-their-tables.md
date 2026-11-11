# ADR-0029: Convex modules own their tables

Date: 2026-11-11

Status: Accepted

## Context

One flat schema let every backend file read and write every table, so feed, sharing and plans code
reached straight into each other's rows and a rule change in one domain needed edits across many
files. The MVP rebuild splits the backend into identity, social, groups, places and plans, and each
step needs a place to land its tables without that coupling growing back.

## Decision

Each backend module owns a schema fragment, and the root schema only composes the fragments. Code in
a module's model reads and writes only the tables its own fragment defines; it reaches another
module's data through that module's model helpers. Modules depend only leftwards, in the order
identity, social, groups, places, plans, and only public function files compose across modules. Lint
enforces table ownership on every database call and requires a literal table name so the check can
see it; the import graph enforces the dependency order.

Rejected: Convex components. They isolate data and functions behind their own deployment boundary,
which gives up typed `Id` references across modules, the shared auth context, and joins in a single
query or mutation, all of which the app relies on. Also rejected: ownership by convention only,
because the flat schema already showed it erodes.

## Consequences

A module's tables can change without touching other modules' code, and a cross-module read becomes a
named helper that is easy to find and bound. Adding a table means choosing its owner up front. Code
outside the model folders is not yet checked; the rebuild moves logic into models module by module,
and each move brings that code under the rule.
