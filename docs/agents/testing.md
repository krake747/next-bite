# Testing

## Test types

| Type    | Runner     | Env      | Location            |
| ------- | ---------- | -------- | ------------------- |
| Unit    | Vitest     | node     | `src/**/*.test.ts`  |
| Browser | Vitest     | jsdom    | `src/**/*.test.tsx` |
| E2E     | Playwright | Chromium | `e2e/*.spec.ts`     |

## Commands

| Command           | What                                  |
| ----------------- | ------------------------------------- |
| `pnpm test`       | Run all Vitest tests (unit + browser) |
| `pnpm test:watch` | Vitest in watch mode                  |
| `pnpm test:e2e`   | Playwright E2E suite                  |
| `pnpm test:all`   | Vitest + Playwright                   |

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

- Place tests alongside source: `src/core/image-utils.test.ts` next to `src/core/image-utils.ts`
- Prefer testing exported functions at their public interface
- Do not test implementation details (internals, private helpers)

## Browser tests

Component tests with jsdom + @testing-library/react. Components in `src/ui/` and `src/pattern/` are
the primary targets.

```tsx
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
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
- `@testing-library/jest-dom` matchers are auto-loaded via `src/test-setup.ts`

## E2E tests

Playwright tests in `e2e/*.spec.ts`. See `docs/agents/testing.md` for conventions. Key helpers live
in `e2e/utils/test-helpers.ts`.

## Configuration

- `vitest.config.ts` — Vitest config with jsdom environment, React plugin, and path aliases
- `src/test-setup.ts` — auto-imports `@testing-library/jest-dom/vitest` matchers
- `playwright.config.ts` — Playwright config with global setup/teardown
