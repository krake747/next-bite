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
        overrides: [
            {
                // Convex mutations must run sequentially (racy in Promise.all);
                // small-N reads stay ordered and fail-closed.
                files: ["convex/**"],
                rules: ["react-doctor/async-await-in-loop"],
            },
            {
                // Convex queries are reactive: server push heals state, no manual
                // invalidation step exists.
                files: ["src/core/convex-client.tsx", "src/core/hooks.ts"],
                rules: ["react-doctor/query-mutation-missing-invalidation"],
            },
            {
                // navigate() lives in event-handler closures (goToLogin/goToDetail),
                // never in render bodies.
                files: ["src/routes/index.tsx", "src/routes/restaurants.$restaurantId.tsx"],
                rules: ["react-doctor/tanstack-start-no-navigate-in-render"],
            },
            {
                // Sections co-export *Meta + *Demo for the registry; ui co-locates
                // cva objects with components per shadcn pattern; core keeps key
                // helpers beside their hooks.
                files: [
                    "src/routes/ds/-sections/**",
                    "src/ui/button.tsx",
                    "src/ui/icon-button.tsx",
                    "src/core/convex-client.tsx",
                ],
                rules: ["react-doctor/only-export-components"],
            },
            {
                // Auth renders a deliberate unknown-state on the server so the
                // first client render matches hydration.
                files: ["src/core/auth-provider.tsx"],
                rules: ["react-doctor/no-hydration-branch-on-browser-global"],
            },
            {
                // Loading verbs render deterministically for SSR, then vary
                // post-hydration by design.
                files: ["src/ui/loading.tsx"],
                rules: ["react-doctor/rendering-hydration-no-flicker"],
            },
            {
                // Both effects are mount-once by design: the store subscribe
                // and the Convex client proxy are unstable across renders, so
                // listing them would re-subscribe in a loop.
                files: ["src/core/auth-provider.tsx", "src/core/convex-client.tsx"],
                rules: ["react-doctor/exhaustive-deps"],
            },
            {
                // Auth-first is fail-closed; validation errors must not leak to
                // unauthenticated callers.
                files: ["convex/users.ts"],
                rules: ["react-doctor/async-defer-await"],
            },
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
