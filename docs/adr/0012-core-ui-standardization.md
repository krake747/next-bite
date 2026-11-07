# Core UI standardization (Phase 2)

Eleven primitives now share one interaction contract: Base UI under the hood where it exists,
consistent heights, `rounded-control` on controls, visible `focus-visible` rings from the `ring`
token, and disabled/error/loading states where applicable. The `shadcn/no-restyle` contract is
load-bearing here: wrappers own their color/typography/spacing/motion, so call sites can only pass
layout classes and must use variants for the rest.

**Considered Options**

- **Leave the dialog/popover call sites as-is**: Rejected. Six direct Base UI dialog imports with
  two style forks plus one popover is exactly the duplication the design system exists to remove; a
  wrapper nobody migrates to is not a standard.
- **Keep the native `<select>`**: Rejected. The accessibility contract requires proper listbox
  keyboard behavior, which the native control styled to look custom cannot honestly provide.
- **Parse `<option>` children in the new Select**: Rejected. Reading child props needs
  `React.Children` (banned by `react/no-react-children`) plus unsafe assertions. The Select takes an
  `options` array instead; its one call site maps friends to options.

**Consequences**

- `src/ui/dialog.tsx`: `Dialog`, `DialogBackdrop` (`overlay`/`fullscreen` × `dim`/`deep`/`dark`),
  `DialogPanel` (`sm`/`md`/`full` × `none`/`sm`/`md` padding × `default`/`celebration`),
  `DialogTitle` (`md`/`lg` × `default`/`inverse`), `DialogDescription`, `DialogCloseButton`
  (`default`/`soft`), `DialogAction`. All seven call sites migrated; the gallery takes the
  `fullscreen` variant, the winner the `celebration` tone. No direct Base UI dialog/popover imports
  remain outside `src/ui`.
- `src/ui/popover.tsx`: `Popover`, `PopoverTrigger` (`plain`/`tinted`), `PopoverPanel`
  (`shadow-popover`). Top-bar account menu migrated.
- `src/ui/button.tsx`: `danger` renamed to `destructive`; added Outline, Ghost, Small, Icon. No
  dedicated `loading` prop on `Button` itself: async submits use `disabled={...isPending}` plus the
  route-level `PendingButton` (`src/routes/-components/pending-button.tsx`, shown in the ds buttons
  section) and `LoadingPlaceholder` for route bootstraps. `render` passthrough for link-buttons
  works via Base UI props spread (`React.ComponentProps<typeof BaseButton>`), not an explicit prop.
  The top-bar Sign In link and login/signup pendings use these patterns.
- `src/ui/badge.tsx`: variants are neutral/brand/success/accent/outline with neutral default;
  Want-to-try reads Tomato, Been-there reads Basil, always labeled. `pink` and the one-off
  `editorial` are gone; the photo overlay takes `brand`.
- `src/ui/field.tsx`: Input/Textarea show `border-destructive` on error and muted disabled states;
  Select is Base UI-backed with the same Formisch field API, bridging through a hidden native select
  that dispatches a real change event (verified by `field.browser.spec.tsx`, which also caught a
  label-resolution gap fixed with a render prop). `FieldErrors` uses the `destructive` token.
- New `src/ui/avatar.tsx` (Base UI Avatar, 24/32/40/48/64, initials fallback, optional static
  presence dot) and `src/ui/tabs.tsx` (no consumers at the time; now used by the dev-only
  `ds/-sections/overlays.tsx` gallery). Card and Skeleton stay single-variant by agreement.
- Small reds folded into tokens (`error-banner`, favorite heart, upload errors, dialog alerts; amber
  hint to `warning`, decorative dot to mango). Wheel canvas colors, rating ramps, and the needle
  stay until Phases 4/5.
- Test hygiene: global `cleanup()` in `src/vitest.setup.ts`; the missing call masked the Select
  display gap.
- No production deploy in Phase 2; verified with `pnpm check:full` and `cf deploy --dry-run`.
