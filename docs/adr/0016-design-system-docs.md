# Design-system documentation and distribution (Phase 6)

Phase 6 makes the system self-describing: a living `/design-system` route rendering the real
components, agent instructions in AGENTS.md, and a `registry.json` describing the distributable
source. Nothing is published to an external registry; components get consumed here first.

**Considered Options**

- **Screenshots or duplicated demo components**: Rejected. The spec forbids both; every example
  renders the actual component with representative mock data.
- **Publish to a registry now**: Rejected. Per the spec, the registry distributes source only once
  components are stable and proven in this app. `registry.json` is metadata describing what would
  ship, not a release.

**Consequences**

- `src/routes/design-system.tsx`: twelve sections in spec order (palette, typography, shape,
  buttons, inputs, cards/badges, avatars, social, activity/photos, restaurant/group, overlays, empty
  states), each a small local component, all interactive elements live (dialog, popover, tabs,
  toggles with noop callbacks, gallery viewer).
- Footer links to `/design-system` for discoverability. `registry.json` maps ui, component, and
  block items to source paths.
- AGENTS.md gains a Design system section condensing the mandatory rules.
- Verification is `pnpm check:full` plus `cf deploy --dry-run` plus a manual visual read of the
  route; no automated test asserts on the docs page itself.
- With this, all six phases are implemented. Remaining: production deploy of Phases 1-6 and the
  manual verification pass (write paths against the real backend, detail route, Maps autocomplete,
  design-system visual read).
