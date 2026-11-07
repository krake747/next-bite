/**
 * @typedef {object} ImportDefinitionLike
 * @property {unknown} node
 *
 * @typedef {object} ImportReferenceLike
 * @property {{ name: string }} identifier
 *
 * @typedef {object} ImportScopeLike
 * @property {Array<ImportVariableLike>} variables
 * @property {Array<ImportScopeLike>} childScopes
 *
 * @typedef {object} ImportVariableLike
 * @property {string} name
 * @property {Array<ImportDefinitionLike>} defs
 * @property {ImportScopeLike} scope
 * @property {Array<ImportReferenceLike>} references
 *
 * @typedef {object} ScopeManagerLike
 * @property {ImportScopeLike} globalScope
 *
 * @typedef {object} FixerLike
 * @property {(node: unknown, text: string) => unknown} replaceText
 *
 * @typedef {object} RuleContextLike
 * @property {(descriptor: unknown) => void} report
 *
 * @typedef {object} SourceCodeLike
 * @property {ScopeManagerLike} scopeManager
 */

const EXEMPT_ICON_IMPORTS = new Set(["Icon", "IconProps", "IconWeight", "IconContext", "IconBase"])

/**
 * @param {string} imported
 * @returns {boolean}
 */
export function isExemptIconImport(imported) {
    return EXEMPT_ICON_IMPORTS.has(imported)
}

/**
 * @param {string} imported
 * @returns {string}
 */
export function expectedIconName(imported) {
    return `${imported}Icon`
}

/**
 * @param {ScopeManagerLike} scopeManager
 * @param {unknown} specifier
 * @returns {ImportVariableLike | null}
 */
export function findImportVariable(scopeManager, specifier) {
    const stack = [scopeManager.globalScope]
    while (stack.length > 0) {
        const scope = stack.pop()
        const found = scope.variables.find((candidate) =>
            candidate.defs.some((definition) => definition.node === specifier),
        )
        if (found !== undefined) {
            return found
        }
        stack.push(...scope.childScopes)
    }
    return null
}

/**
 * @param {ImportVariableLike} variable
 * @param {string} expected
 * @returns {boolean}
 */
export function isIconNameTaken(variable, expected) {
    return variable.scope.variables.some((candidate) => candidate !== variable && candidate.name === expected)
}

/**
 * @typedef {object} IconSpecifierLike
 * @property {string} type
 * @property {{ name: string }} local
 * @property {string} [importKind]
 * @property {{ type: string, name: string }} [imported]
 */

/**
 * @param {FixerLike} fixer
 * @param {IconSpecifierLike} specifier
 * @param {ImportVariableLike | null} variable
 * @param {string} local
 * @param {string} imported
 * @param {string} expected
 * @returns {Array<unknown> | null}
 */
export function suffixFixes(fixer, specifier, variable, local, imported, expected) {
    if (variable !== null && isIconNameTaken(variable, expected)) {
        return null
    }
    const target = local === imported ? specifier : specifier.local
    const fixes = [fixer.replaceText(target, expected)]
    if (variable === null) {
        return fixes
    }
    for (const reference of variable.references) {
        if (reference.identifier.name === local) {
            fixes.push(fixer.replaceText(reference.identifier, expected))
        }
    }
    return fixes
}

/**
 * @typedef {object} ExpressionLike
 * @property {string} type
 * @property {boolean} [computed]
 * @property {ExpressionLike} [callee]
 * @property {ExpressionLike} [object]
 * @property {ExpressionLike} [property]
 * @property {ExpressionLike} [key]
 * @property {ExpressionLike} [source]
 * @property {ExpressionLike} [meta]
 * @property {string} [name]
 * @property {string} [importKind]
 * @property {unknown} [value]
 * @property {Array<ExpressionLike>} [arguments]
 * @property {Array<ExpressionLike>} [properties]
 * @property {Array<ExpressionLike>} [specifiers]
 */

/**
 * @param {ExpressionLike} node
 * @returns {boolean}
 */
export function isViSetConfigCall(node) {
    return (
        node.callee.type === "MemberExpression" &&
        !node.callee.computed &&
        node.callee.object.type === "Identifier" &&
        node.callee.object.name === "vi" &&
        node.callee.property.type === "Identifier" &&
        node.callee.property.name === "setConfig"
    )
}

/**
 * @param {ExpressionLike} node
 * @returns {boolean}
 */
export function isPhosphorIconImport(node) {
    return node.source.value === "@phosphor-icons/react" && node.importKind !== "type"
}

/**
 * @param {ExpressionLike} node
 * @returns {boolean}
 */
export function isImportMetaEnvRead(node) {
    return (
        node.object.type === "MetaProperty" &&
        node.object.meta.name === "import" &&
        node.object.property.name === "meta" &&
        node.property.type === "Identifier" &&
        node.property.name === "env"
    )
}

/**
 * @param {RuleContextLike} context
 * @param {ExpressionLike} node
 * @param {IconSpecifierLike} specifier
 */
function reportReactTypeImport(context, node, specifier) {
    const typeOnly = node.importKind === "type" || specifier.importKind === "type"
    if (typeOnly && specifier.local) {
        context.report({
            node: specifier,
            messageId: "unexpected",
            data: { name: specifier.local.name },
        })
    }
}

/**
 * @param {RuleContextLike} context
 * @param {ExpressionLike} node
 */
export function reportReactTypeImports(context, node) {
    for (const specifier of node.specifiers ?? []) {
        reportReactTypeImport(context, node, specifier)
    }
}

/**
 * @param {ExpressionLike} property
 * @returns {boolean}
 */
function isTimeoutProperty(property) {
    if (property.type !== "Property") {
        return false
    }
    if (property.key.type === "Identifier" && property.key.name === "testTimeout") {
        return true
    }
    return property.key.type === "Literal" && property.key.value === "testTimeout"
}

/**
 * @param {ExpressionLike} argument
 * @returns {boolean}
 */
export function configArgumentSetsTimeout(argument) {
    return argument.type === "ObjectExpression" && argument.properties.some(isTimeoutProperty)
}

/**
 * @typedef {object} IconSpecifierLike
 * @property {string} type
 * @property {{ name: string }} local
 * @property {string} [importKind]
 * @property {{ type: string, name: string }} imported
 */

/**
 * @param {RuleContextLike} context
 * @param {SourceCodeLike} sourceCode
 * @param {{ specifiers: Array<IconSpecifierLike> }} node
 */
export function reportPhosphorSpecifiers(context, sourceCode, node) {
    for (const specifier of node.specifiers) {
        reportIconSpecifier(context, sourceCode, specifier)
    }
}

/**
 * @param {RuleContextLike} context
 * @param {SourceCodeLike} sourceCode
 * @param {IconSpecifierLike} specifier
 */
function reportIconSpecifier(context, sourceCode, specifier) {
    if (specifier.type === "ImportDefaultSpecifier") {
        const local = specifier.local.name
        context.report({
            node: specifier,
            messageId: "defaultImport",
            data: { name: local, expected: `${local}Icon` },
        })
        return
    }
    if (specifier.type === "ImportNamespaceSpecifier") {
        context.report({ node: specifier, messageId: "namespaceImport" })
        return
    }
    if (specifier.type !== "ImportSpecifier") {
        return
    }
    if (specifier.importKind === "type") {
        return
    }
    if (specifier.imported.type !== "Identifier") {
        return
    }
    if (isExemptIconImport(specifier.imported.name)) {
        return
    }
    const imported = specifier.imported.name
    const local = specifier.local.name
    if (local.endsWith("Icon")) {
        return
    }
    const expected = expectedIconName(imported)
    context.report({
        node: specifier.local,
        messageId: "missingSuffix",
        data: { name: imported, expected },
        fix(/** @type {FixerLike} */ fixer) {
            if (local === expected) {
                return null
            }
            return suffixFixes(
                fixer,
                specifier,
                findImportVariable(sourceCode.scopeManager, specifier),
                local,
                imported,
                expected,
            )
        },
    })
}
