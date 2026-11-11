import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"

const DB_METHODS = new Set(["query", "insert", "get", "patch", "replace", "delete"])

/**
 * @typedef {object} NodeLike
 * @property {string} type
 * @property {string} [name]
 * @property {unknown} [value]
 * @property {NodeLike} [object]
 * @property {NodeLike} [property]
 * @property {NodeLike} [callee]
 * @property {Array<NodeLike>} [arguments]
 *
 * @typedef {{ method: string, table: string | null, node: NodeLike }} TableAccess
 */

/**
 * @param {string} source
 * @returns {Array<string>}
 */
function fragmentTables(source) {
    return [...source.matchAll(/^ {4}(\w+): defineTable\(/gmu)].map((match) => match[1])
}

/**
 * @param {string} modelDir
 * @returns {Map<string, string>}
 */
export function readTableOwners(modelDir) {
    /** @type {Map<string, string>} */
    const owners = new Map()
    for (const entry of readdirSync(modelDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) {
            continue
        }
        const source = readFileSync(path.join(modelDir, entry.name, "schema.ts"), "utf8")
        for (const table of fragmentTables(source)) {
            owners.set(table, entry.name)
        }
    }
    return owners
}

/**
 * @param {string} filename
 * @returns {string | null}
 */
export function moduleOfFile(filename) {
    const match = /(?:^|[\\/])convex[\\/]model[\\/]([^\\/]+)[\\/]/u.exec(filename)
    return match ? match[1] : null
}

/**
 * @param {NodeLike | undefined} node
 * @returns {boolean}
 */
function isDatabase(node) {
    const name = node?.type === "MemberExpression" ? node.property?.name : node?.name
    return name === "db"
}

/**
 * @param {NodeLike} callee
 * @returns {string | null}
 */
function databaseMethod(callee) {
    if (callee.type !== "MemberExpression" || !isDatabase(callee.object)) {
        return null
    }
    const method = callee.property?.name ?? ""
    return DB_METHODS.has(method) ? method : null
}

/**
 * @param {NodeLike} call
 * @returns {TableAccess | null}
 */
export function tableAccess(call) {
    const method = call.callee ? databaseMethod(call.callee) : null
    if (method === null) {
        return null
    }
    const first = call.arguments?.[0] ?? call
    const table = first.type === "Literal" && typeof first.value === "string" ? first.value : null
    return { method, table, node: first }
}

/**
 * @param {string | undefined} owner
 * @param {string} module
 * @returns {"unowned" | "foreign" | null}
 */
export function ownershipProblem(owner, module) {
    if (owner === undefined) {
        return "unowned"
    }
    return owner === module ? null : "foreign"
}
