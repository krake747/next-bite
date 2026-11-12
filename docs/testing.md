# Testing

Vitest projects in `vite.config.ts` own tiers, environments, and timeouts; `playwright.config.ts`
and `e2e/` own the end-to-end suite.

## Tiers

The filename suffix picks the tier. `pnpm test` runs every tier; `package.json` has a script for
most single tiers (convex runs via `pnpm test --project convex`).

| Suffix                         | Tier        | Use for                                                              |
| ------------------------------ | ----------- | -------------------------------------------------------------------- |
| `*.pure.spec.ts`               | pure        | Logic with no DOM, in node with no setup file                        |
| `*.spec.{ts,tsx}` in `src/`    | unit        | Hooks and isolated UI under happy-dom                                |
| `*.browser.spec.tsx`           | browser     | Real components through full interaction in Playwright chromium      |
| `*.integration.spec.{ts,tsx}`  | integration | Few: route specs against the real `routeTree`, or a backend contract |
| `*.spec.{ts,tsx}` in `convex/` | convex      | Backend contracts with `convex-test` through generated function refs |

The browser tier needs chromium once: `npx playwright install chromium --only-shell`.

## Which tier proves a change

| Change                           | Proof                                                           |
| -------------------------------- | --------------------------------------------------------------- |
| Pure logic in `src/core/`        | Pure spec next to the source                                    |
| Hooks and isolated UI            | Unit spec                                                       |
| Full interaction components      | Browser spec                                                    |
| Route-level or backend contract  | Integration spec, or a convex contract                          |
| Convex schema or function change | `convex/_generated/ai/guidelines.md`, then `docs/migrations.md` |
| Built Worker smoke               | `pnpm test:e2e`                                                 |

Paste failing and passing runs verbatim into the ticket or PR. Stop only processes your run started,
never broad kills. Secrets come from `.env.local`; never invent or print them.

## Running

Run tests for the files you change: `pnpm test:affected` picks them from the last recorded run (seed
it once with `pnpm test`), and `--project <tier>` narrows further.
`pnpm exec vitest run --clearCache` resets a stale selection. Browser and route specs always run, so
it skips only part of the suite. Run the full suite only when asked.

After changing `optimizeDeps`, test projects, or dependencies, run the affected tier once from a
cold Vite cache (`rm -rf node_modules/.vite`). CI is always cold, and warm caches hide optimizer
reloads.

## Rules

- Place tests next to the source and test the public interface. `CODING_STANDARDS.md` sets the bar
  for what a test proves.
- Timeouts live in the Vitest projects, never in spec files (lint-enforced).
- Browser specs: `render` is async; keep the `screen` it returns. Query by text or `data-slot`, not
  CSS classes. There is no `queryBy`: assert absence with a negated element assertion. Interact
  through locators (`click`, `fill`, `upload`) and open popups the real way.
- Waits: `expect.element` retries, so use it instead of `waitFor`. Poll plain values with
  `expect.poll` and lookups with `vi.waitUntil`, never `vi.waitFor` around an assertion. A faster
  wait that newly fails exposed a race: fix the timing or assert the settled state, never slow the
  wait back down.
- HTTP: only specs that touch HTTP import `server` from `src/vitest.msw.setup.ts` and script it with
  `server.use(...)` per test, not `vi.stubGlobal("fetch")`. No Testcontainers or live backends.
- Route specs with backend data: `AuthProvider` wraps children in its own live `ConvexProvider`, so
  never inject a client through context. Mock `@api/auth.provider` with a passthrough `AuthProvider`
  and a scripted `useAuthContext`, wrap the tree in `ConvexProvider`, and serve seeded results
  through `createSeededClient` in `src/api/db/seeded.client.ts`. Build keys with its `seedKey`
  helper. Hooks that call `useQueryClient` need a `QueryClientProvider`.

## End to end

`pnpm test:e2e` is on demand, outside the push gate and CI. It runs one smoke test,
`e2e/smoke.spec.ts`, against the built production Worker served locally: the landing page paints its
heading. To run it against a server you already have, set `E2E_NO_SERVER=1` and point `E2E_BASE_URL`
at it.

## Coverage

`pnpm test:coverage` covers pure, unit, and integration. Browser stays out because chromium is slow
and flaky as a gate signal; convex stays out because edge-runtime results do not merge into the v8
report. PR CI comments the report, and `main` uploads it as an artifact.
