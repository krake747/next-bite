// doctor.config.ts - React Doctor static review configuration
// Read https://react.doctor/docs/configuration/config-files before you change rules.
// Fallow owns dead code, dupes, and boundaries. vp lint owns per-file correctness.
// React Doctor owns React-shape review: effects, state architecture, security, a11y.
// The compiler-cleanup bucket (redundant memoization) activates only when React Compiler is
// detected. The compiler runs here through oxc (verified: client chunks import the
// compiler-runtime chunk; SSR output stays uncompiled by design), so this bucket is live.
// nextbite/no-manual-memo still enforces the rule deterministically at lint time.
import { defineConfig } from "react-doctor/api"

// oxlint-disable-next-line import/no-default-export -- react-doctor loads doctor.config.ts through its default export by design
export default defineConfig({
    ignore: {
        files: [
            ".cloudflare/**",
            "convex/**",
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
                // Convex queries are reactive: server push heals state, no manual
                // invalidation step exists.
                files: ["src/api/convex.client.tsx", "src/core/hooks.ts"],
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
                    "src/api/convex.client.tsx",
                ],
                rules: ["react-doctor/only-export-components"],
            },
            {
                // Auth renders a deliberate unknown-state on the server so the
                // first client render matches hydration.
                files: ["src/api/auth.provider.tsx"],
                rules: ["react-doctor/no-hydration-branch-on-browser-global"],
            },
            {
                // Loading verbs render deterministically for SSR, then vary
                // post-hydration by design.
                files: ["src/ui/loading.tsx"],
                rules: ["react-doctor/rendering-hydration-no-flicker"],
            },
            {
                // This surface is pointer/gesture only (click, wheel, pinch);
                // keyboard equivalents live in the ZoomControls buttons.
                files: ["src/pattern/gallery/lightbox-view.tsx"],
                rules: ["react-doctor/click-events-have-key-events", "react-doctor/no-static-element-interactions"],
            },
            {
                // Both effects are mount-once by design: the store subscribe
                // and the Convex client proxy are unstable across renders, so
                // listing them would re-subscribe in a loop.
                files: ["src/api/auth.provider.tsx", "src/api/convex.client.tsx"],
                rules: ["react-doctor/exhaustive-deps"],
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
