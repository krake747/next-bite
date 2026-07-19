# Base UI for headless React primitives

The SolidJS app used @kobalte/core for headless UI primitives (Dialog, DropdownMenu, Collapsible,
Button). For React, we chose Base UI (`@base-ui-components/react`) over Radix Primitives, Ariakit,
and Ark UI. Base UI is built for React 19's APIs (useActionState, startTransition), has a smaller
API surface matching exactly the primitives we need (Dialog, Popover, Button), and ships zero styles
— our existing Tailwind classes carry over. Radix was the strongest alternative (battle-tested,
backs shadcn/ui) but carries a larger bundle and a broader React version surface area we don't need.

**Considered Options**

- **Radix Primitives**: Most mature, largest ecosystem. Rejected because its broader React version
  support means it doesn't take advantage of React 19 APIs, and it ships more components than we
  need.
- **Ariakit**: Lightweight, single-maintainer dependency. Rejected due to bus-factor risk.
- **Ark UI**: Cross-framework from the Chakra/Zag ecosystem. Rejected because we don't need
  cross-framework compatibility in a React-only app.

**Consequences**

- Fewer community examples and StackOverflow answers than Radix.
- Must verify WAI-ARIA behavior in E2E tests since Base UI is newer.
