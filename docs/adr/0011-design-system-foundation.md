# Design system foundation (Phase 1)

The app carried a dark-mode-capable theme (`flame-pea` + Tailwind neutrals, Fraunces/Manrope, a
`ThemeProvider` with toggle and `localStorage` persistence, 317 `dark:` variants in 36 files). The
adopted identity is light-only Tomato & Butter with Bricolage Grotesque + DM Sans. Phase 1 lays that
foundation without redesigning any screen.

**Considered Options**

- **Big-bang restyle per component**: Rejected. 224 palette uses across 29 files cannot be restyled
  safely by hand in one pass; spec orders foundation first, components later.
- **Alias old names to new values**: Rejected. Keeping `flame-pea-*` class names while changing
  their hexes (or aliasing `dark:` to light) hides debt instead of removing it.
- **Mechanical palette swap + full dark removal (chosen)**: tokens rewritten to the spec, class
  names renamed to the new scales, every `dark:` variant stripped, theme plumbing deleted.
  Components render the new palette with unchanged structure.

**Consequences**

- `src/index.css` holds primitives (tomato/mango/basil/plum/stone) plus semantic mappings
  (`background`, `surface`, `primary`, `border`, `success`, `warning`, `destructive`, `info`,
  `ring`), `font-sans`/`font-display` utilities, radius (`control`/`panel`/`card`/`dialog`) and
  shadows (`card`/`popover`/`dialog`, dialog added beyond the spec sample which omitted it).
- Fraunces/Manrope packages and `src/ui/theme-context.tsx`, `theme-toggle.tsx` are deleted;
  `__root.tsx` and `TopBar` no longer reference them. Stored `next-bite-theme` keys are left
  orphaned as agreed. `places-autocomplete` pins `colorScheme = "light"`.
- `flame-pea-*` became `tomato-*` (`950` folded into `tomato-900`), `neutral-*` became `stone-*`,
  `bg-[#faf9f7]` became `bg-background`, `bg-white` became `bg-surface`, dialog shadows became
  `shadow-popover`, `Card` uses `border-border` + `shadow-card`.
- Deliberately deferred: per-component semantic-token migration (Phase 2 standardization), wheel
  canvas colors (browns, golds, confetti) and rating ramps (Phase 4/5), `/ds` route and registry
  (Phase 6, landed as `src/routes/ds/` with `$sectionId` sections, dev-only). Red/amber/orange
  accents outside the error paths stay until Phase 2.
- No production deploy in Phase 1; verified with `pnpm check:full` and `cf deploy --dry-run`.
