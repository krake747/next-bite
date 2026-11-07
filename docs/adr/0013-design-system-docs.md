# Design-system documentation and distribution (Phase 6)

Phase 6 makes the system self-describing: a living `/ds` route rendering the real components
(`src/routes/ds/` with `index.tsx`, `route.tsx`, `$sectionId.tsx`, `-sections/`, dev-gated via
`env.DEV`), agent instructions in AGENTS.md, and a `registry.json` describing the distributable
source. Nothing is published to an external registry; components get consumed here first.

**Considered Options**

- **Screenshots or duplicated demo components**: Rejected. The spec forbids both; every example
  renders the actual component with representative mock data.
- **Publish to a registry now**: Rejected. Per the spec, the registry distributes source only once
  components are stable and proven in this app. `registry.json` is metadata describing what would
  ship, not a release.

**Consequences**

- `src/routes/ds/` (dev-only, redirects to `/` when `!env.DEV`): sections in spec order (palette,
  typography, shape, buttons, inputs, cards/badges, avatars, social, activity/photos,
  restaurant/group, overlays, empty states), each a small local section component, all interactive
  elements live (dialog, popover, tabs, toggles with noop callbacks, gallery viewer).
- Footer links to `/ds` for discoverability (dev-only route, redirects to `/` in prod).
  `registry.json` maps ui, component, and block items to source paths.
- No dedicated AGENTS.md Design system section: the mandatory rules live in `CODING_STANDARDS.md`
  and the AGENTS.md rules table (`shadcn/no-restyle`, CVA variants, Base UI primitives).
- Verification is `pnpm check:full` plus `cf deploy --dry-run` plus a manual visual read of the
  route; no automated test asserts on the docs page itself.
- With this, all six phases are implemented. Remaining: production deploy of Phases 1-6 and the
  manual verification pass (write paths against the real backend, detail route, Maps autocomplete,
  design-system visual read).
