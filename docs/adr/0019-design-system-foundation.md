# ADR-0019: Design system foundation

Date: 2026-11-05

Status: Accepted

## Context

The app carried a dark-mode-capable theme with hundreds of dark variants across dozens of files. The
adopted identity is light-only with a new palette and typefaces. The foundation must land without
redesigning any screen, and without hiding debt under renamed-but-identical classes.

## Decision

Mechanical palette swap plus full dark removal, renaming classes to the new scales; components
render the new palette with unchanged structure. Rejected: big-bang per-component restyle (unsafe by
hand in one pass), and aliasing old names to new values (hides debt instead of removing it).

## Consequences

One stylesheet holds primitives plus semantic mappings, font utilities, radii, and shadows; theme
plumbing and stored theme keys are deleted. Per-component semantic migration, canvas colors, and
rating ramps explicitly defer to later phases.
