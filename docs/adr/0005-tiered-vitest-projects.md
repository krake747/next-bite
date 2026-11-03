# Tiered Vitest projects on happy-dom

All tests shared one flat `jsdom` project with `*.test.*` names and a global setup file. We adopted
filename-suffix tiers (`*.pure.spec`, `*.spec`, `*.browser.spec`, `*.integration.spec`) backed by
Vitest projects on `happy-dom`, with per-project timeouts in `vite.config.ts` and an MSW lifecycle
seam in `src/vitest.setup.ts` for HTTP-boundary control. Pure logic runs in node with no setup file
and stays fast.

**Considered Options**

- **Keep flat `.test.*` on jsdom**: Rejected because one environment and one setup file hides which
  tests need a DOM and gives HTTP-touching specs no boundary control.
- **Tiered projects**: Chosen so scope follows the filename: `pnpm test:pure`, `test:unit`,
  `test:browser`, and `test:integration` run independently, and timeouts live in config instead of
  `vi.setConfig` calls in spec files.

**Consequences**

- New specs must use the suffix matching their scope; the unit project excludes the suffixed tiers.
- Browser specs run under happy-dom today; that project is the seam for a real-browser runner later.
- The MSW server starts with `onUnhandledFrame: "error"`, so unexpected network access fails loudly.
