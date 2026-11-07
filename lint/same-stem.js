import { readdirSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

const ROOTS = ["src", "convex", "lint", "e2e"]
const SKIP_DIRS = new Set(["node_modules", "dist", "_generated"])
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"])

/**
 * @param {string} filename
 * @returns {string}
 */
function stemOf(filename) {
    const ext = path.extname(filename)
    return filename.slice(0, filename.length - ext.length)
}

/**
 * @param {Map<string, Set<string>>} seen
 * @param {string} dir
 * @param {string} filename
 */
export function recordFile(seen, dir, filename) {
    const ext = path.extname(filename)
    if (!SOURCE_EXTENSIONS.has(ext)) {
        return
    }
    const key = `${dir}/${stemOf(filename)}`
    const exts = seen.get(key) ?? new Set()
    exts.add(ext)
    seen.set(key, exts)
}

/**
 * @param {string} dir
 * @param {Map<string, Set<string>>} seen
 */
function collect(dir, seen) {
    /** @type {import("node:fs").Dirent<string>[]} */
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name)) {
                collect(path.join(dir, entry.name), seen)
            }
            continue
        }
        recordFile(seen, dir, entry.name)
    }
}

/**
 * @param {[string, Set<string>]} entry
 * @returns {boolean}
 */
export function hasMultipleExtensions(entry) {
    return entry[1].size > 1
}

/**
 * @param {[string, Set<string>]} a
 * @param {[string, Set<string>]} b
 * @returns {number}
 */
export function compareCollisionKeys(a, b) {
    return a[0] < b[0] ? -1 : 1
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function compareStrings(a, b) {
    if (a < b) {
        return -1
    }
    return a > b ? 1 : 0
}

/**
 * @param {[string, Set<string>]} collision
 * @returns {string}
 */
export function formatCollision(collision) {
    const [key, exts] = collision
    // oxlint-disable-next-line unicorn/no-array-sort -- sorting a fresh copy; the lint program lib predates toSorted
    const ordered = [...exts].sort(compareStrings)
    return `same-stem collision: ${key}{${ordered.join(",")}}`
}

function run() {
    /** @type {Map<string, Set<string>>} */
    const seen = new Map()
    for (const root of ROOTS) {
        try {
            collect(root, seen)
        } catch {
            continue
        }
    }
    // oxlint-disable-next-line unicorn/no-array-sort -- sorting a fresh copy; the lint program lib predates toSorted
    const collisions = [...seen.entries()].filter(hasMultipleExtensions).sort(compareCollisionKeys)
    if (collisions.length > 0) {
        throw new Error(collisions.map(formatCollision).join("\n"))
    }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
    run()
}
