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
                files: ["src/api/convex.client.tsx", "src/core/hooks.ts"],
                rules: ["react-doctor/query-mutation-missing-invalidation"],
            },
            {
                files: ["src/routes/index.tsx", "src/routes/restaurants.$restaurantId.tsx"],
                rules: ["react-doctor/tanstack-start-no-navigate-in-render"],
            },
            {
                files: [
                    "src/routes/ds/-sections/**",
                    "src/ui/button.tsx",
                    "src/ui/icon-button.tsx",
                    "src/api/convex.client.tsx",
                ],
                rules: ["react-doctor/only-export-components"],
            },
            {
                files: ["src/api/auth.provider.tsx"],
                rules: ["react-doctor/no-hydration-branch-on-browser-global"],
            },
            {
                files: ["src/ui/loading.tsx"],
                rules: ["react-doctor/rendering-hydration-no-flicker"],
            },
            {
                files: ["src/pattern/gallery/lightbox-view.tsx"],
                rules: ["react-doctor/click-events-have-key-events", "react-doctor/no-static-element-interactions"],
            },
            {
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
