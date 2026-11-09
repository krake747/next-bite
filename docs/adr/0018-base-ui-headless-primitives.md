# ADR-0018: Base UI for headless React primitives

Date: 2026-07-19

Status: Accepted

## Context

The app needs headless primitives (dialog, dropdown, collapsible, button) with proper accessibility
behavior and zero imposed styles, so existing classes carry over. The choice is between the mature
incumbent, a lightweight single-maintainer option, a cross-framework option, and the React-19-native
one.

## Decision

Base UI: built for current React APIs, with a small surface matching exactly the primitives needed.
Rejected: the mature incumbent (larger bundle and broader version surface than needed), the
lightweight option (bus-factor risk), and the cross-framework option (no cross-framework need in a
React-only app).

## Consequences

Fewer community examples and answers than the incumbent. The library is newer, so WAI-ARIA behavior
gets verified in end-to-end tests rather than assumed.
