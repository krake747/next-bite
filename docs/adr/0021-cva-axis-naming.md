# CVA axis naming: tone is color, variant is structure

Component variants used two names for the color axis (`variant` in Button and Badge, `tone` in
IconButton, Dialog parts, and PopoverTrigger), and overloaded `variant` for layout in
DialogBackdrop. Call sites had to memorize per-component vocabulary, and the `dark` tone key read
like dark mode.

**Considered Options**

- **Color stays `variant`, layout renames**: Rejected because DialogBackdrop already pairs a layout
  `variant` with a color axis, so one of them moves either way, and the majority of components plus
  all multi-axis components already speak `tone` for color.
- **`tone` names the color axis, `variant` names structure and layout, `size` keeps size**:
  Accepted. Every color choice reads `tone`, every structural choice (backdrop overlay versus
  fullscreen) reads `variant`. Rendered state attributes keep their own names: Badge still reports
  `data-variant`, which names variant state, not the prop.

**Consequences**

- Button and Badge rename their color axis from `variant` to `tone`; every other component already
  complies. Callers pass `tone` for color on all primitives.
- New components follow the same three axes and pick existing value names before inventing new ones.
  Reviewers reject new color axes under any other name.
- `docs/agents/testing.md` query conventions are unaffected: slots and state attributes do not move
  with this rename.
