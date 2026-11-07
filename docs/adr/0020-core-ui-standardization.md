# ADR-0020: Core UI standardization

Date: 2026-11-05

Status: Accepted

## Context

Multiple style forks of the same primitives, with call sites reaching past wrappers into styling.
The system needs one interaction contract: wrappers own presentation, call sites pass layout and
pick variants.

## Decision

Wrappers own color, typography, spacing, and motion; call sites pass layout classes and use variants
for the rest. The new select takes an options array rather than parsing option children (child
parsing needs banned APIs plus unsafe assertions). Async submits use disabled state plus route-level
pending affordances, not a button-level loading prop; link-button rendering works through the
underlying props spread, not an explicit passthrough. Rejected: leaving call sites as-is (a wrapper
nobody migrates to is not a standard), and keeping the native select (a styled native control cannot
honestly provide listbox keyboard behavior).

## Consequences

All primitives share consistent heights, control rounding, visible focus rings, and
disabled/error/loading states. No direct primitive imports remain outside the UI layer. Small color
uses fold into semantic tokens. Test hygiene (global cleanup) is part of the contract: its absence
once masked a real display gap.
