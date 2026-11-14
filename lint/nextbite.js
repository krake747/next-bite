import { fileURLToPath } from "node:url"

import { definePlugin, defineRule } from "vite-plus/lint/plugins"

import {
    configArgumentSetsTimeout,
    coreHookBindings,
    isButtonRenderedAsLink,
    isEffectHookCall,
    isImportMetaEnvRead,
    isPhosphorIconImport,
    isViSetConfigCall,
    reportPhosphorSpecifiers,
    reportReactTypeImports,
    wholeObjectHookBinding,
} from "./rule-helpers.js"
import { moduleOfFile, ownershipProblem, readTableOwners, tableAccess } from "./table-owners.js"

const noReactTypeImports = defineRule({
    meta: {
        type: "problem",
        docs: {
            description: "Forbid type imports from react; use the global React namespace.",
        },
        messages: {
            unexpected: "Type import from react. Use the global React namespace instead (React.{{name}}).",
        },
    },
    create(context) {
        return {
            ImportDeclaration(node) {
                if (node.source.value !== "react") {
                    return
                }
                reportReactTypeImports(context, node)
            },
        }
    },
})

const noManualMemo = defineRule({
    meta: {
        type: "problem",
        docs: {
            description: "React Compiler memoizes automatically; do not call useMemo or useCallback.",
        },
        messages: {
            unexpected:
                "React Compiler handles memoization. Remove {{name}}, or allow nextbite/no-manual-memo for this file in vite.config.ts when a dependency needs manual memo.",
        },
    },
    create(context) {
        return {
            CallExpression(node) {
                if (node.callee.type !== "Identifier") {
                    return
                }
                if (node.callee.name !== "useMemo" && node.callee.name !== "useCallback") {
                    return
                }
                context.report({ node, messageId: "unexpected", data: { name: node.callee.name } })
            },
        }
    },
})

const noTestTimeout = defineRule({
    meta: {
        type: "problem",
        docs: {
            description: "Forbid per-file test timeouts; timeouts live in vite.config.ts test projects.",
        },
        messages: {
            unexpected: "Per-file test timeout. Set the timeout on the tier project in vite.config.ts instead.",
        },
    },
    create(context) {
        return {
            CallExpression(node) {
                if (!isViSetConfigCall(node)) {
                    return
                }
                if (node.arguments.some(configArgumentSetsTimeout)) {
                    context.report({ node, messageId: "unexpected" })
                }
            },
        }
    },
})

const noDirectEnvRead = defineRule({
    meta: {
        type: "problem",
        docs: {
            description: "Read VITE_* only through src/core/env.ts; never import.meta.env directly.",
        },
        messages: {
            unexpected: "Direct import.meta.env read. Import env from @core/env instead.",
        },
    },
    create(context) {
        return {
            MemberExpression(node) {
                if (isImportMetaEnvRead(node)) {
                    context.report({ node, messageId: "unexpected" })
                }
            },
        }
    },
})

const jsxSpreadLast = defineRule({
    meta: {
        type: "problem",
        docs: {
            description: "Keep JSX spread attributes last so consumer props override.",
        },
        messages: {
            unexpected: "JSX spread is not last. Move {...props} after explicit props.",
        },
    },
    create(context) {
        return {
            JSXOpeningElement(node) {
                const spread = node.attributes.findIndex((attribute) => attribute.type === "JSXSpreadAttribute")
                if (spread !== -1 && spread !== node.attributes.length - 1) {
                    context.report({ node: node.attributes[spread], messageId: "unexpected" })
                }
            },
        }
    },
})

const noUseContext = defineRule({
    meta: {
        type: "problem",
        docs: {
            description: "Read context with use() instead of useContext().",
        },
        messages: {
            unexpected: "useContext call. Use use(Context) instead.",
        },
    },
    create(context) {
        return {
            CallExpression(node) {
                if (node.callee.type !== "Identifier" || node.callee.name !== "useContext") {
                    return
                }
                context.report({ node: node.callee, messageId: "unexpected" })
            },
        }
    },
})

const noExportList = defineRule({
    meta: {
        type: "problem",
        docs: {
            description: "Put export on the declaration; no trailing export specifier lists.",
        },
        messages: {
            unexpected: "Trailing export list. Move export onto each declaration instead.",
        },
    },
    create(context) {
        return {
            ExportNamedDeclaration(node) {
                if (node.source !== null || node.declaration !== null || node.specifiers.length === 0) {
                    return
                }
                context.report({ node, messageId: "unexpected" })
            },
        }
    },
})

const phosphorIconSuffix = defineRule({
    meta: {
        type: "suggestion",
        docs: {
            description: "Require Icon suffix for Phosphor icon imports.",
        },
        fixable: "code",
        messages: {
            missingSuffix: "Phosphor icon {{name}} must use Icon suffix. Use {{expected}}.",
            defaultImport: "Import Phosphor icons as named imports with Icon suffix. Use { {{expected}} }.",
            namespaceImport: "Do not namespace import Phosphor icons. Import each icon with Icon suffix.",
        },
    },
    create(context) {
        const sourceCode = context.sourceCode
        return {
            ImportDeclaration(node) {
                if (!isPhosphorIconImport(node)) {
                    return
                }
                reportPhosphorSpecifiers(context, sourceCode, node)
            },
        }
    },
})
const noButtonAsLink = defineRule({
    meta: {
        type: "problem",
        docs: {
            description: "Do not render Button as a link; a Link styled with button() classes keeps link semantics.",
        },
        messages: {
            unexpected:
                "Button rendered as a link. Use ButtonLink from @pattern/button-link instead: Button render with a link either warns (nativeButton) or mistates semantics (role=button).",
        },
    },
    create(context) {
        return {
            JSXOpeningElement(node) {
                if (!isButtonRenderedAsLink(node)) {
                    return
                }
                context.report({ node, messageId: "unexpected" })
            },
        }
    },
})

const tableOwners = readTableOwners(fileURLToPath(new URL("../convex/model/", import.meta.url)))

const convexTableOwner = defineRule({
    meta: {
        type: "problem",
        docs: {
            description: "A Convex model reads and writes only the tables its module's schema fragment defines.",
        },
        messages: {
            foreign:
                "Table {{table}} belongs to the {{owner}} module, not {{module}}. Call a {{owner}} model helper instead.",
            unowned: "Table {{table}} is not defined in any convex/model/*/schema.ts fragment.",
            dynamic: "db.{{method}} needs a string-literal table name so table ownership can be checked.",
        },
    },
    create(context) {
        const module = moduleOfFile(context.filename)
        if (module === null) {
            return {}
        }
        return {
            CallExpression(node) {
                const access = tableAccess(node)
                if (access === null) {
                    return
                }
                if (access.table === null) {
                    context.report({ node: access.node, messageId: "dynamic", data: { method: access.method } })
                    return
                }
                const owner = tableOwners.get(access.table)
                const messageId = ownershipProblem(owner, module)
                if (messageId !== null) {
                    context.report({ node: access.node, messageId, data: { table: access.table, owner, module } })
                }
            },
        }
    },
})

const noUnstableEffectDeps = defineRule({
    meta: {
        type: "problem",
        docs: {
            description:
                "Do not depend on whole objects returned from @core hooks in effect or memo deps; their identity changes every render and refires the effect in a loop.",
        },
        messages: {
            unexpected:
                "{{name}} is a per-render object from {{hook}}. Depending on it refires the effect every render. Destructure the stable members you need, or depend on stable inputs instead.",
        },
    },
    create(context) {
        /** @type {Set<string>} */
        const hooks = new Set()
        /** @type {Map<string, string>} */
        const bindings = new Map()
        // usePlace* wrappers return the stable mutateAsync function itself
        // (see src/core/restaurants.ts), so depending on them is safe.
        /** @type {Set<string>} */
        const stableHooks = new Set(["usePlaceLocation", "usePlaceAtmosphere", "usePlaceDetails"])
        return {
            ImportDeclaration(node) {
                for (const binding of coreHookBindings(node)) {
                    if (typeof binding?.local === "string") {
                        hooks.add(binding.local)
                    }
                }
            },
            VariableDeclarator(node) {
                const binding = wholeObjectHookBinding(node, hooks, stableHooks)
                if (binding !== null && typeof binding.name === "string" && typeof binding.hook === "string") {
                    bindings.set(binding.name, binding.hook)
                }
            },
            CallExpression(node) {
                if (!isEffectHookCall(node)) {
                    return
                }
                const deps = node.arguments[1]
                if (deps?.type !== "ArrayExpression") {
                    return
                }
                for (const element of deps.elements ?? []) {
                    if (element?.type !== "Identifier") {
                        continue
                    }
                    const hook = bindings.get(element.name)
                    if (typeof hook !== "string") {
                        continue
                    }
                    context.report({
                        node: element,
                        messageId: "unexpected",
                        data: { name: element.name, hook },
                    })
                }
            },
        }
    },
})

export default definePlugin({
    meta: { name: "nextbite" },
    rules: {
        "no-react-type-imports": noReactTypeImports,
        "no-manual-memo": noManualMemo,
        "no-test-timeout": noTestTimeout,
        "no-use-context": noUseContext,
        "no-export-list": noExportList,
        "no-direct-env-read": noDirectEnvRead,
        "no-button-as-link": noButtonAsLink,
        "jsx-spread-last": jsxSpreadLast,
        "phosphor-icon-suffix": phosphorIconSuffix,
        "convex-table-owner": convexTableOwner,
        "no-unstable-effect-deps": noUnstableEffectDeps,
    },
})
