import { definePlugin, defineRule } from "vite-plus/lint/plugins"

import {
    configArgumentSetsTimeout,
    isImportMetaEnvRead,
    isPhosphorIconImport,
    isViSetConfigCall,
    reportPhosphorSpecifiers,
    reportReactTypeImports,
} from "./rule-helpers.js"

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
export default definePlugin({
    meta: { name: "nextbite" },
    rules: {
        "no-react-type-imports": noReactTypeImports,
        "no-manual-memo": noManualMemo,
        "no-test-timeout": noTestTimeout,
        "no-use-context": noUseContext,
        "no-export-list": noExportList,
        "no-direct-env-read": noDirectEnvRead,
        "jsx-spread-last": jsxSpreadLast,
        "phosphor-icon-suffix": phosphorIconSuffix,
    },
})
