// doctor.config.ts - React Doctor static review configuration
// Read https://react.doctor/docs/configuration/config-files before you change rules.
// Fallow owns dead code, dupes, and boundaries. vp lint owns per-file correctness.
// React Doctor owns React-shape review: effects, state architecture, security, a11y.
// The compiler-cleanup bucket (redundant memoization) activates only when React Compiler is
// detected; detection did not fire in endeavour for react({ compiler }) inside lazyPlugins,
// and this repo uses the same pattern (vite.config.ts), so the bucket is expected dormant.
// nextbite/no-manual-memo already enforces that rule deterministically.
import { defineConfig } from "react-doctor/api"

// oxlint-disable-next-line import/no-default-export -- react-doctor loads doctor.config.ts through its default export by design
export default defineConfig({
    ignore: {
        files: [
            ".cloudflare/**",
            "convex/_generated/**",
            "src/vite-env.d.ts",
            "routeTree.gen.ts",
            "dist/**",
            "public/**",
            "pnpm-lock.yaml",
            "skills-lock.json",
            ".agents/**",
        ],
    },
    categories: {
        Maintainability: "warn",
    },
    buckets: {
        "compiler-cleanup": "error",
    },
    scope: "changed",
    base: "main",
    blocking: "warning",
    supplyChain: {
        enabled: false,
    },
    adoptExistingLintConfig: true,
    respectInlineDisables: true,
})
