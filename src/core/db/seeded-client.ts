import { type ConvexClient } from "convex/browser"
import { getFunctionName } from "convex/server"

import { convexArgsKey } from "../convex-client"

export type SeedMap = Map<string, unknown>
export type MutationCall = { fn: string; args: unknown }

export function seedKey(fn: string, args: unknown): string {
    return `${fn}|${convexArgsKey(args)}`
}

export type SeededClientOptions = {
    readonly seeds?: SeedMap | undefined
    readonly calls?: MutationCall[] | undefined
    readonly mutateResult?: unknown
    readonly liveRows?: ReadonlyArray<unknown> | undefined
    readonly queryHook?: (() => Promise<unknown>) | undefined
}

// Test-only Convex client: serves seeded query results by function path plus args and records
// mutations by function path. Stands in for the Convex subscription surface where the real
// AuthProvider would otherwise shadow injected values with a live client. Queries without a
// seed fall back to the live rows, which pushState refreshes for every subscriber, so the
// same double drives both keyed route specs and live collection specs.
export function createSeededClient(options: SeededClientOptions = {}) {
    const seeds = options.seeds ?? new Map<string, unknown>()
    const calls = options.calls ?? []
    const mutateResult = options.mutateResult ?? "m1"
    let liveRows: ReadonlyArray<unknown> = options.liveRows === undefined ? [] : [...options.liveRows]
    const receivers = new Set<{
        key: string
        receive: (value: unknown) => void
        current: unknown
    }>()
    const failers = new Map<string, Set<(error: unknown) => void>>()

    const valueFor = (key: string): unknown => {
        const seeded = seeds.get(key)
        if (seeded !== undefined) {
            return structuredClone(seeded)
        }
        return structuredClone([...liveRows])
    }

    const trackFailureHandler = (key: string, onError: ((error: unknown) => void) | undefined): void => {
        if (typeof onError !== "function") {
            return
        }
        let set = failers.get(key)
        if (set === undefined) {
            set = new Set()
            failers.set(key, set)
        }
        set.add(onError)
    }

    const untrackFailureHandler = (key: string, onError: ((error: unknown) => void) | undefined): void => {
        if (typeof onError !== "function") {
            return
        }
        failers.get(key)?.delete(onError)
    }

    const syncClient = {
        onUpdate: (
            ref: unknown,
            args: unknown,
            receive: (result: unknown) => void,
            onError?: (error: unknown) => void,
        ) => {
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only function reference shaped to the Convex subscription surface
            const key = seedKey(getFunctionName(ref as never), args)
            const entry = { key, receive, current: valueFor(key) }
            receivers.add(entry)
            trackFailureHandler(key, onError)
            receive(entry.current)
            const forget = () => {
                receivers.delete(entry)
                untrackFailureHandler(key, onError)
            }
            return Object.assign(forget, {
                unsubscribe: forget,
                getCurrentValue: () => entry.current,
            })
        },
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only query stub standing in for client.query
        query: (async () => {
            if (options.queryHook !== undefined) {
                return options.queryHook()
            }
            await Promise.resolve()
            return []
        }) as ConvexClient["query"],
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only mutation recorder standing in for client.mutation
        mutation: (async (ref: unknown, args: unknown) => {
            await Promise.resolve()
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only function reference shaped to the Convex subscription surface
            calls.push({ fn: getFunctionName(ref as never), args })
            return mutateResult
        }) as ConvexClient["mutation"],
    }

    const pushState = (rows: ReadonlyArray<unknown>, key?: string): void => {
        if (key === undefined) {
            liveRows = [...rows]
        } else {
            seeds.set(key, [...rows])
        }
        for (const entry of receivers) {
            const matches = key === undefined ? !seeds.has(entry.key) : entry.key === key
            if (matches) {
                entry.current = valueFor(entry.key)
                entry.receive(entry.current)
            }
        }
    }

    // Drive a mid-session sync failure the way a dropped Convex subscription
    // surfaces it: the adapter reports the error through the onUpdate error
    // callback it registered at subscribe time.
    const failSync = (error: unknown = new Error("Convex subscription failed")): void => {
        for (const set of failers.values()) {
            for (const fail of set) {
                fail(error)
            }
        }
    }

    return {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only sync client standing in for the Convex subscription surface
        client: syncClient as unknown as ConvexClient,
        pushState,
        subscriberCount: (): number => receivers.size,
        failSync,
    }
}
