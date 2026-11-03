# Vite+ toolchain with co-located config

Next Bite ran vanilla Vite 8 with fmt/lint config scattered across dotfiles and no push gate. We
migrated to the Vite+ (`vp`) toolchain with `vite-plus-core`, pnpm 12, and Node 26 to match the
reference setup in `captain/endeavour`: `fmt` and `lint` config now lives in `vite.config.ts`, and
`test` projects move there too. `oxlint`, `oxfmt`, and the Babel React Compiler preset left the
dependency list; the compiler runs natively via `@vitejs/plugin-react` plus `oxc-transform-react`.

**Considered Options**

- **Stay on vanilla Vite 8**: Rejected because it keeps the Babel compiler bridge and the scattered
  dotfiles, diverging from the reference toolchain we want to track.
- **Adopt Vite+**: Chosen for one toolchain owner (`vp` delegates packages to `pnpm`), one config
  file, and the native compiler path.

**Consequences**

- `pnpm dev`, `pnpm build`, `pnpm fmt`, and `pnpm lint` all run through `vp`.
- Gate tiers: `pnpm check` (everyday), `pnpm check:arch` (fallow), `pnpm check:full` (everything
  plus build). The lefthook pre-push hook runs `pnpm check`; CI runs `check:full` via
  `voidzero-dev/setup-vp`.
- Conventional commits enforced by commitlint in the `commit-msg` hook.
