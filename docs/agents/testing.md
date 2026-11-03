# Testing

## Test types

Tiers are picked by filename suffix. `pnpm test` runs them all; scope with `pnpm test:pure`,
`pnpm test:unit`, `pnpm test:browser`, or `pnpm test:integration`.

| Suffix                  | Runner | Env       | Location                       |
| ----------------------- | ------ | --------- | ------------------------------ |
| `*.pure.spec.ts`        | Vitest | node      | `src/**/*.pure.spec.ts`        |
| `*.spec.{ts,tsx}`       | Vitest | happy-dom | `src/**/*.spec.{ts,tsx}`       |
| `*.browser.spec.tsx`    | Vitest | happy-dom | `src/**/*.browser.spec.tsx`    |
| `*.integration.spec.ts` | Vitest | happy-dom | `src/**/*.integration.spec.ts` |

- `*.pure.spec.ts`: logic with no DOM. Runs in node with no setup file, stays fast.
- `*.spec.{ts,tsx}`: unit scope. Hooks and isolated UI under happy-dom. The unit project excludes
  the suffixed tiers in `vite.config.ts`.
- `*.browser.spec.tsx`: real components through full interaction: open the popup, then choose by
  keyboard. Runs under happy-dom today; this project is the seam for a real-browser runner later.
- `*.integration.spec.{ts,tsx}`: few, only where it truly matters. Route-level specs against the
  real `routeTree` or a backend contract.

## Commands

| Command                 | What                              |
| ----------------------- | --------------------------------- |
| `pnpm test`             | Run all Vitest tiers              |
| `pnpm test:pure`        | Logic with no DOM                 |
| `pnpm test:unit`        | Hooks and isolated UI             |
| `pnpm test:browser`     | Full interaction components       |
| `pnpm test:integration` | Route-level and backend contracts |
| `pnpm test:watch`       | Vitest in watch mode              |

Run tests only for files you change. Run the full suite only when asked.

## Unit tests

Pure logic, no DOM. Functions in `src/core/` are the primary target.

```ts
import { describe, it, expect } from "vitest"

import { formatFileSize } from "./image-utils"

describe("formatFileSize", () => {
  it("formats kilobytes", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB")
  })
})
```

- Place tests alongside source: `src/core/image-utils.pure.spec.ts` next to
  `src/core/image-utils.ts`
- Prefer testing exported functions at their public interface
- Do not test implementation details (internals, private helpers)
- Keep timeouts in `vite.config.ts` test projects, never `vi.setConfig` timeouts in spec files

## Browser tests

Component tests with happy-dom plus @testing-library/react. Components in `src/ui/` and
`src/pattern/` are the primary targets.

```tsx
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { Badge } from "./badge"

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Hello</Badge>)
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })
})
```

- Render the component with realistic props
- Query by text content or `data-slot` attribute (not CSS classes)
- Test one behaviour per test case
- Interact like the browser does: open popups through the real path, then choose by keyboard
- `@testing-library/jest-dom` matchers are auto-loaded via `src/vitest.setup.ts`

## MSW for HTTP

Selected specs control HTTP at the boundary with Mock Service Worker (`msw/node` `setupServer`).
Lifecycle lives in `src/vitest.setup.ts` (listen with `onUnhandledFrame: "error"`, `resetHandlers`
after each test, `close` after the suite).

Use `server.use(...)` per test for one-off sequences. Prefer that over `vi.stubGlobal("fetch")`. Do
not add Testcontainers or a live backend dependency to these tests.

## Configuration

- `vite.config.ts` holds the Vitest projects (timeouts, environments, aliases)
- `src/vitest.setup.ts` wires `@testing-library/jest-dom/vitest` matchers plus the MSW lifecycle
