# Testing

## Test pyramid

This project has no unit tests. The only automated tests are **Playwright E2E tests** in `e2e/`.
When writing new tests, start with E2E for feature-level behaviour. Add unit/integration tests
only when a piece of pure logic has enough edge cases to warrant isolation.

## E2E tests (Playwright)

Tests live in `e2e/` with the `.spec.ts` extension. Helpers live in `e2e/utils/test-helpers.ts`.

### Running

| Command | What it does |
|---------|--------------|
| `pnpm test:e2e` | Run all E2E tests (headless, single worker) |
| `pnpm exec playwright test --ui` | Open Playwright UI mode |
| `pnpm exec playwright test --headed` | Run headfully |
| `pnpm exec playwright test auth.spec.ts` | Run a single file |

The Playwright config (`playwright.config.ts`) spins up the Vite dev server automatically.
Tests run against the local dev server at `http://localhost:5173`.

### Global setup

`e2e/global-setup.ts` seeds the database by calling the Convex `test:seed` mutation. It creates
test friends so dropdowns are populated for every test run.

`e2e/global-teardown.ts` cleans up test users by calling `test:cleanup`.

### Helpers (e2e/utils/test-helpers.ts)

- `testEmail(label)` — generates a unique e2e test email (`e2e-<label>-<timestamp>@example.com`)
- `testPassword()` — returns a fixed test password
- `signUp(page, email, password, name)` — full signup flow
- `signIn(page, email, password)` — full login flow
- `signOut(page)` — logout via account menu
- `waitForAppLoad(page)` — waits for `[data-slot="top-bar"]` to appear
- `addRestaurant(page, data)` — creates a restaurant through the UI
- `fillLocationField(page, location)` — handles the Google Maps Places input gracefully
- `assertAuthenticated(page)` / `assertUnauthenticated(page)` — auth state assertions

### Conventions

- Each spec file creates its own test user via `signUp`. Don't share users across files.
- Use `test.setTimeout(60000)` for tests that create accounts and interact with the API.
- Use `Date.now()` in test data names to avoid collisions across runs.
- Assert on visual presence (`toBeVisible`, `not.toBeVisible`) rather than internal state.
- Use `data-slot` attributes (`[data-slot="card"]`, `[data-slot="top-bar"]`) for locating
  components. These are stable selectors that don't change with styling or copy.

## When to add unit/integration tests

Unit tests (Vitest, alongside source files as `*.test.ts`) are appropriate for:

- Pure utility functions with non-trivial logic
- Zod schemas with complex validation rules
- State management hooks (reducers, store logic)
- Data transformation pipelines

When adding unit tests:
- Place them next to the source file (e.g. `src/core/opening-hours.test.ts` next to
  `src/core/opening-hours.ts`)
- Use `vitest` for runner and assertions
- Mock external dependencies at the module boundary, not inside the function under test

## Lint and build verification

Before committing, always run these (in order, stopping at first failure):

```
pnpm fmt:check     # formatting
pnpm lint          # oxlint
pnpm lint:ts       # TypeScript type-checking
pnpm build         # production build
pnpm fallow audit  # layer boundary + unused code checks
pnpm test:e2e      # Playwright E2E suite
```

Each command must pass before work is considered complete.
