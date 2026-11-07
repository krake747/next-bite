# ADR-0021: CVA axis naming

Date: 2026-11-06

Status: Accepted

## Context

Components used two names for the color axis while overloading one of them for layout, so call sites
memorized per-component vocabulary to express the same choices.

## Decision

`tone` names the color axis, `variant` names structure and layout, `size` keeps size. Every color
choice reads `tone`, every structural choice reads `variant`. Rejected: keeping color on `variant`,
which forces the one layout-overloaded component to stay inconsistent while every other component
and all multi-axis components already speak `tone`.

## Consequences

New components follow the same three axes and pick existing value names before inventing new ones;
reviewers reject new color axes under any other name. Rendered state attributes keep their own
names, which describe state, not props.
