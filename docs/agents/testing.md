# Testing

Owned values live in `sources-of-truth.md`; this file holds tiers and examples only.

## Test types

Tiers are picked by filename suffix. `pnpm test` runs them all; scope with `pnpm test:pure`,
`pnpm test:unit`, `pnpm test:browser`, or `pnpm test:integration`.

| Suffix                        | Runner | Env                    | Location                                                                      |
| ----------------------------- | ------ | ---------------------- | ----------------------------------------------------------------------------- |
| `*.pure.spec.ts`              | Vitest | node                   | `src/**/*.pure.spec.ts`, `lint/**/*.pure.spec.js`, `convex/**/*.pure.spec.ts` |
| `*.spec.{ts,tsx}`             | Vitest | happy-dom              | `src/**/*.spec.{ts,tsx}`                                                      |
| `*.browser.spec.tsx`          | Vitest | chromium (Playwright)  | `src/**/*.browser.spec.tsx`                                                   |
| `*.integration.spec.{ts,tsx}` | Vitest | happy-dom              | `src/**/*.integration.spec.{ts,tsx}`                                          |
| `*.spec.{ts,tsx}`             | Vitest | edge-runtime (backend) | `convex/**/*.spec.{ts,tsx}` (not `*.pure.spec.*`)                             |

- `*.pure.spec.ts`: logic with no DOM. Runs in node with no setup file, stays fast.
- `*.spec.{ts,tsx}`: unit scope. Hooks and isolated UI under happy-dom. The unit project excludes
  the suffixed tiers in `vite.config.ts`.
- `*.browser.spec.tsx`: real components through full interaction in Playwright chromium (headless in
  CI): open the popup, then choose by keyboard. Install the browser once with
  `npx playwright install chromium --only-shell` before running this tier.
- `*.integration.spec.{ts,tsx}`: few, only where it truly matters. Route-level specs against the
  real `routeTree` or a backend contract.
- Backend contract tests with `convex-test` in `convex/` run in edge-runtime under the
  `*.spec.{ts,tsx}` suffix (the `convex` project excludes `*.pure.spec.*`, which stay in the pure
  tier). Test files use `import.meta.glob("./**/*.ts")` and call functions through generated
  `api`/`internal` references.

## Commands

| Command                 | What                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm test`             | Run all Vitest tiers                                                                                                           |
| `pnpm test:pure`        | Logic with no DOM                                                                                                              |
| `pnpm test:unit`        | Hooks and isolated UI                                                                                                          |
| `pnpm test:browser`     | Full interaction components                                                                                                    |
| `pnpm test:integration` | Route-level and backend contracts                                                                                              |
| `pnpm test:watch`       | Vitest in watch mode                                                                                                           |
| `pnpm test:e2e`         | Playwright gate in a real browser against a local Worker preview (on demand, needs browsers plus wrangler; see `toolchain.md`) |

Run tests only for files you change. `pnpm test:affected` selects the affected tests from the
recorded dependencies (seed it once with `pnpm test`); scope further with `--project <tier>` when
you know it. If the selection looks stale, `pnpm exec vitest run --clearCache` resets the records.
Two blind spots: the browser tier always runs (no per-file records in browser mode) and the seven
route specs always run (a virtual HMR dependency never resolves), so the loop saves roughly half the
suite, not all of it. Run the full suite only when asked.

## Unit tests

Pure logic, no DOM. Functions in `src/core/` are the primary target.

```ts
import { describe, test, expect } from "vitest"

import { formatFileSize } from "./image.utils"

describe("formatFileSize", () => {
  test("formats kilobytes", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB")
  })
})
```

- Place tests alongside source: `src/core/image.utils.pure.spec.ts` next to
  `src/core/image.utils.ts`
- Prefer testing exported functions at their public interface
- Do not test implementation details (internals, private helpers)
- Keep timeouts in `vite.config.ts` test projects, never `vi.setConfig` timeouts in spec files. The
  rule is `slowTestThreshold = testTimeout - 500` in every project, so slow warnings fire on the
  same margin before the timeout kills the test

## Browser tests

Component tests in real chromium via `vitest-browser-react`. Components in `src/ui/` and
`src/pattern/` are the primary targets.

```tsx
import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { Badge } from "./badge"

describe("Badge", () => {
  test("renders children", async () => {
    const screen = await render(<Badge>Hello</Badge>)
    await expect.element(screen.getByText("Hello")).toBeInTheDocument()
  })
})
```

- Render the component with realistic props; `render` is async, keep the `screen` it returns
- Query by text content or `data-slot` attribute (not CSS classes); there is no `queryBy`, assert
  absence with a negated element assertion on a `getBy` locator
- Test one behaviour per test case
- Interact like the browser does through locators: `await loc.click()`, `await input.fill("text")`,
  `await input.upload(files)`; open popups through the real path
- `await expect.element(...)` auto-retries; use it instead of `waitFor`. Poll plain JS state with
  `await expect.poll(() => value).matcher(...)`; use `await vi.waitUntil(() => lookup, { message })`
  for a lookup that turns truthy, never `vi.waitFor` around an assertion. When a faster wait newly
  fails, it exposed a real race: fix the timing or assert the settled state, never slow the wait
  back down
- `@testing-library/jest-dom` matchers are auto-loaded via `src/vitest.setup.ts`

## MSW for HTTP

Selected specs control HTTP at the boundary with Mock Service Worker (`msw/node` `setupServer`).
Only specs that touch HTTP import `server` from `src/vitest.msw.setup.ts`, which registers its own
`listen` (with `onUnhandledFrame: "error"`), `resetHandlers`, and `close` lifecycle for that file.
All DOM projects share the minimal `src/vitest.setup.ts` (jest-dom matchers plus `cleanup`); the MSW
server never starts globally, so non-HTTP specs pay no interceptor cost.

Use `server.use(...)` per test for one-off sequences. Prefer that over `vi.stubGlobal("fetch")`. Do
not add Testcontainers or a live backend dependency to these tests.

## Route specs that need backend data

`AuthProvider` wraps children in its own live `ConvexProvider`, which shadows any test-injected
client for hooks that read `useConvexQuery` directly. So route specs never inject through context.
Instead: mock `@api/auth.provider` with a passthrough `AuthProvider` plus a scripted
`useAuthContext` (session re-exports it as `useAuth`), wrap the tree in `ConvexProvider`, and serve
seeded query results plus a mutation recorder through `createSeededClient` in
`src/api/db/seeded.client.ts`. Build seed keys with its `seedKey` helper, never hand-rolled strings;
subscriptions spread args (`{...undefined}` is `{}`) while the cache keys the unspread value, and
the helper already normalises that. Hooks that call `useQueryClient` need a `QueryClientProvider` in
the wrapper.

## Configuration

- `vite.config.ts` holds the Vitest projects (timeouts, environments, aliases). The three DOM
  projects share one `domSetupFiles` entry plus one happy-dom options object; only the browser
  project's `environment` line changes when the real-browser runner lands
- `src/vitest.setup.ts` wires `@testing-library/jest-dom/vitest` matchers plus `cleanup`
- `src/vitest.msw.setup.ts` owns the MSW lifecycle and is imported only by HTTP specs
