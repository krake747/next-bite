import { cloudflare } from "@cloudflare/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import { default as react } from "@vitejs/plugin-react"
import { defineConfig, lazyPlugins } from "vite-plus"

// https://viteplus.dev/config/
const domSetupFiles = ["./src/vitest.setup.ts"]
const happyDomEnvironmentOptions = {
    happyDOM: {
        settings: {
            fetch: {
                disableSameOriginPolicy: true,
            },
        },
    },
}

export default defineConfig({
    fmt: {
        printWidth: 120,
        tabWidth: 4,
        semi: false,
        sortImports: {
            internalPattern: ["@core", "@ui", "@pattern", "@features", "@routes", "@convex"],
        },
        sortTailwindcss: {
            stylesheet: "src/index.css",
            functions: ["cx", "cva"],
            attributes: ["class", "className", "classList"],
        },
        sortPackageJson: {
            sortScripts: true,
        },
        overrides: [
            {
                files: ["*.json", "*.jsonc"],
                options: {
                    tabWidth: 4,
                    trailingComma: "none",
                },
            },
            {
                files: ["*.yml", "*.yaml"],
                options: {
                    tabWidth: 2,
                },
            },
            {
                files: ["*.md"],
                options: {
                    printWidth: 100,
                    tabWidth: 2,
                    proseWrap: "always",
                },
            },
        ],
        ignorePatterns: [
            "pnpm-lock.yaml",
            "skills-lock.json",
            "src/routeTree.gen.ts",
            "convex/_generated/**",
            "public/**",
            "dist/**",
            ".github/**",
            ".agents/**",
        ],
    },
    lint: {
        plugins: ["unicorn", "typescript", "oxc", "react", "react-perf", "import", "vitest"],
        ignorePatterns: [
            "src/routeTree.gen.ts",
            "src/vite-env.d.ts",
            "convex/_generated/**",
            "dist/**",
            "node_modules/**",
        ],
        env: {
            builtin: true,
            browser: true,
        },
        options: {
            typeAware: true,
            typeCheck: false,
        },
        settings: {
            shadcn: {
                ui: "@ui",
            },
        },
        categories: {
            correctness: "error",
            perf: "error",
            restriction: "error",
            suspicious: "error",
            pedantic: "error",
        },
        rules: {
            "no-console": "allow",
            "no-undefined": "allow",
            "no-empty-function": [
                "error",
                {
                    allow: ["arrowFunctions"],
                },
            ],
            "oxc/no-barrel-file": [
                "error",
                {
                    threshold: 0,
                },
            ],
            curly: "error",
            "max-lines": "allow",
            "no-plusplus": [
                "error",
                {
                    allowForLoopAfterthoughts: true,
                },
            ],
            "no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "no-warning-comments": [
                "allow",
                {
                    terms: ["todo"],
                    location: "start",
                    decoration: [],
                },
            ],
            "no-inline-comments": "allow",
            "require-unicode-regexp": "allow",
            "no-underscore-dangle": "allow",
            "no-await-in-loop": "allow",
            "no-empty": "allow",
            "no-void": "allow",
            "no-negated-condition": "allow",
            "no-useless-return": "allow",
            "no-eq-null": "allow",
            "default-case": "allow",
            "require-await": "allow",
            radix: "allow",
            "no-bitwise": "allow",
            "no-alert": "allow",
            "no-array-sort": "error",
            "no-array-callback-reference": "allow",
            eqeqeq: "error",
            "nextbite/no-direct-env-read": "error",
            "nextbite/no-manual-memo": "error",
            "nextbite/no-test-timeout": "error",
            "nextbite/no-use-context": "error",
            "nextbite/no-export-list": "error",
            "nextbite/no-react-type-imports": "error",
            "nextbite/jsx-spread-last": "error",
            "nextbite/phosphor-icon-suffix": "error",
            "shadcn/no-restyle": [
                "error",
                {
                    allow: ["layout"],
                    contracts: [
                        {
                            pattern: "^Skeleton$",
                            allow: ["layout", "shape", "color"],
                        },
                    ],
                },
            ],
            "react/todo": "allow",
            "react/refs": "allow",
            "react/purity": "allow",
            "react/set-state-in-effect": "allow",
            "react/exhaustive-effect-dependencies": "allow",
        },
        overrides: [
            {
                files: ["**/*.{js,ts,tsx}"],
                plugins: ["oxc"],
                rules: {
                    "oxc/no-async-await": "allow",
                    "oxc/no-optional-chaining": "allow",
                    "oxc/no-rest-spread-properties": "allow",
                    "eslint/max-depth": ["error", 3],
                },
            },
            {
                files: ["**/*.{js,ts,tsx}"],
                plugins: ["eslint"],
                rules: {
                    "eslint/max-depth": ["error", 3],
                    "eslint/max-lines-per-function": "allow",
                    "eslint/max-nested-callbacks": ["error", 5],
                    "no-shadow": "allow",
                    "no-use-before-define": "allow",
                },
            },
            {
                files: ["**/*.{jsx,tsx}"],
                plugins: ["react", "react-perf"],
                rules: {
                    "react/jsx-filename-extension": "allow",
                    "react/react-in-jsx-scope": "allow",
                    "react/no-multi-comp": [
                        "error",
                        {
                            ignoreStateless: true,
                        },
                    ],
                    "react/only-export-components": "allow",
                    "react/no-unstable-nested-components": [
                        "error",
                        {
                            allowAsProps: true,
                        },
                    ],
                    "react/jsx-no-literals": "allow",
                    "react/jsx-no-constructed-context-values": "allow",
                    "react/forbid-component-props": "allow",
                    "react/button-has-type": "allow",
                    "react/no-unescaped-entities": "allow",
                    "react/no-array-index-key": "allow",
                    "react-perf/jsx-no-new-function-as-prop": "allow",
                    "react-perf/jsx-no-new-array-as-prop": "allow",
                    "react-perf/jsx-no-new-object-as-prop": "allow",
                    "react-perf/jsx-no-jsx-as-prop": "allow",
                    "react-hooks/exhaustive-deps": "allow",
                    "react-hooks/rules-of-hooks": "allow",
                },
            },
            {
                files: ["src/routes/**/*.tsx"],
                plugins: ["react"],
                rules: {
                    "react/only-export-components": "allow",
                },
            },
            {
                files: ["**/*.{ts,tsx}"],
                plugins: ["import"],
                rules: {
                    "import/consistent-type-specifier-style": ["error", "prefer-inline"],
                    "import/max-dependencies": "allow",
                    "import/namespace": "allow",
                    "import/no-relative-parent-imports": "allow",
                    "import/no-unassigned-import": "allow",
                    "import/unambiguous": "allow",
                },
            },
            {
                files: ["**/*.{ts,tsx}"],
                plugins: ["typescript"],
                rules: {
                    "typescript/explicit-function-return-type": "allow",
                    "typescript/explicit-module-boundary-types": "allow",
                    "typescript/no-import-type-side-effects": "allow",
                    "typescript/explicit-member-accessibility": "allow",
                    "typescript/ban-types": "allow",
                    "typescript/array-type": [
                        "error",
                        {
                            default: "array",
                            readonly: "generic",
                        },
                    ],
                    "typescript/consistent-type-definitions": ["error", "type"],
                    "typescript/prefer-readonly-parameter-types": "allow",
                    "typescript/strict-boolean-expressions": "allow",
                    "typescript/no-empty-object-type": "allow",
                    "typescript/no-non-null-assertion": "allow",
                    "typescript/no-explicit-any": "allow",
                },
            },
            {
                files: ["**/*.{js,ts,tsx}"],
                plugins: ["unicorn"],
                rules: {
                    "unicorn/no-abusive-eslint-disable": "allow",
                    "unicorn/no-instanceof-builtins": "allow",
                    "unicorn/no-nested-ternary": "allow",
                    "unicorn/no-array-reduce": "allow",
                    "unicorn/prefer-module": "allow",
                    "unicorn/prefer-node-protocol": "allow",
                    "unicorn/prefer-number-properties": "allow",
                    "unicorn/prefer-number-coercion": "allow",
                    "unicorn/consistent-function-scoping": "allow",
                    "unicorn/prefer-at": "allow",
                    "unicorn/prefer-add-event-listener": "allow",
                    "unicorn/prefer-dom-node-append": "allow",
                    "unicorn/no-useless-undefined": [
                        "error",
                        {
                            checkArguments: false,
                        },
                    ],
                    "unicorn/prefer-modern-math-apis": "allow",
                    "unicorn/prefer-code-point": "allow",
                    "unicorn/prefer-string-slice": "allow",
                    "unicorn/prefer-query-selector": "allow",
                    "unicorn/explicit-length-check": "allow",
                    "unicorn/no-negated-condition": "allow",
                },
            },
            {
                files: ["convex/**"],
                plugins: ["import"],
                rules: {
                    "import/no-default-export": "allow",
                    "import/no-relative-parent-imports": "allow",
                },
            },
            {
                files: ["**/*.{spec,test}.{ts,tsx}"],
                plugins: ["vitest", "typescript", "eslint"],
                rules: {
                    "typescript/no-explicit-any": "allow",
                    "no-undefined": "allow",
                    "require-unicode-regexp": "allow",
                    "no-await-in-loop": "allow",
                    "vitest/require-test-timeout": "allow",
                },
            },
            {
                files: ["scripts/**"],
                plugins: ["typescript", "eslint"],
                rules: {
                    "typescript/no-non-null-assertion": "allow",
                    "require-unicode-regexp": "allow",
                    "no-await-in-loop": "allow",
                },
            },
            {
                files: ["src/router.tsx"],
                plugins: ["typescript"],
                rules: {
                    "typescript/consistent-type-definitions": "allow",
                },
            },
            {
                files: ["convex/http.ts"],
                plugins: ["typescript"],
                rules: {
                    "typescript/require-await": "allow",
                },
            },
            {
                files: ["src/core/env.ts"],
                rules: {
                    "nextbite/no-direct-env-read": "allow",
                },
            },
            {
                files: ["lint/**"],
                plugins: ["typescript", "import"],
                rules: {
                    "typescript/prefer-readonly-parameter-types": "allow",
                    "typescript/strict-boolean-expressions": "allow",
                    "import/no-default-export": "allow",
                },
            },
            {
                files: ["src/server.ts"],
                plugins: ["import"],
                rules: {
                    "import/no-default-export": "allow",
                },
            },
            {
                files: ["vite.config.ts", "cloudflare.config.ts", "playwright.config.ts"],
                plugins: ["import"],
                rules: {
                    "import/no-default-export": "allow",
                },
            },
        ],
        jsPlugins: [
            {
                name: "shadcn",
                specifier: "@shadcn/lint",
            },
            {
                name: "nextbite",
                specifier: "./lint/nextbite.js",
            },
        ],
    },
    staged: {
        "*.{ts,tsx,js,jsx,json,css,md}": "vp fmt --no-error-on-unmatched-pattern",
        "*.{ts,tsx}": "vp lint --no-error-on-unmatched-pattern --fix",
    },
    resolve: {
        tsconfigPaths: true,
    },
    optimizeDeps: {
        // Pre-bundle route-split deep imports so navigating to a lazy route
        // does not trigger "optimized dependencies changed" reloads.
        include: [
            "@base-ui/react/avatar",
            "@base-ui/react/button",
            "@base-ui/react/dialog",
            "@base-ui/react/popover",
            "@base-ui/react/select",
            "@base-ui/react/tabs",
            "@base-ui/react/use-render",
            "@formisch/react",
            "@phosphor-icons/react",
        ],
    },
    build: {
        license: { fileName: "license.md" },
    },
    plugins: lazyPlugins(() => [
        ...(process.env["VITEST"] === "true" ? [] : [cloudflare()]),
        tanstackStart({
            prerender: {
                enabled: false,
            },
            router: {
                routeFileIgnorePattern: "\\.spec\\.(ts|tsx)$",
            },
        }),
        react({ compiler: { target: "19" } }),
        tailwindcss(),
    ]),
    test: {
        globals: false,
        env: {
            VITE_CONVEX_URL: "https://example.convex.cloud",
            VITE_CONVEX_SITE_URL: "https://example.convex.site",
            VITE_GOOGLE_MAPS_API_KEY: "test-key",
        },
        // Timeout rule: slowTestThreshold is testTimeout minus 500ms in every project, so
        // slow warnings fire on the same margin before the timeout kills the test.
        projects: [
            {
                test: {
                    name: "pure",
                    environment: "node",
                    include: ["src/**/*.pure.spec.{js,ts,jsx,tsx}"],
                    testTimeout: 2000,
                    slowTestThreshold: 1500,
                },
            },
            {
                test: {
                    name: "unit",
                    environment: "happy-dom",
                    environmentOptions: happyDomEnvironmentOptions,
                    setupFiles: domSetupFiles,
                    include: ["src/**/*.spec.{js,ts,jsx,tsx}"],
                    exclude: ["**/*.pure.spec.*", "**/*.browser.spec.*", "**/*.integration.spec.*"],
                    testTimeout: 3000,
                    slowTestThreshold: 2500,
                },
            },
            {
                // happy-dom today; swap only this project's environment when the real-browser
                // runner lands (ADR-0005). Keep include plus timeouts tier scoped.
                test: {
                    name: "browser",
                    environment: "happy-dom",
                    environmentOptions: happyDomEnvironmentOptions,
                    setupFiles: domSetupFiles,
                    include: ["src/**/*.browser.spec.{js,ts,jsx,tsx}"],
                    testTimeout: 2000,
                    slowTestThreshold: 1500,
                },
            },
            {
                test: {
                    name: "integration",
                    environment: "happy-dom",
                    environmentOptions: happyDomEnvironmentOptions,
                    setupFiles: domSetupFiles,
                    include: ["src/**/*.integration.spec.{js,ts,jsx,tsx}"],
                    testTimeout: 3000,
                    slowTestThreshold: 2500,
                },
            },
        ],
    },
})
