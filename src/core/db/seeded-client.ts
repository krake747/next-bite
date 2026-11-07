import { QueryClient } from "@tanstack/react-query"
import { type ConvexReactClient } from "convex/react"
import { getFunctionName } from "convex/server"

import { ConvexQueryClient } from "@convex-dev/react-query"

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

type Receiver = {
    key: string
    receive: (value: unknown) => void
    current: unknown
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
    const receivers = new Set<Receiver>()
    const watchReceivers = new Set<Receiver>()
    const failers = new Map<string, Set<(error: unknown) => void>>()

    const valueFor = (key: string): unknown => {
        const seeded = seeds.get(key)
        if (seeded !== undefined) {
            return structuredClone(seeded)
        }
        return structuredClone([...liveRows])
    }

    function nameOf(ref: unknown): string {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only function reference shaped to the Convex subscription surface
        return typeof ref === "string" ? ref : getFunctionName(ref as never)
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
            const key = seedKey(nameOf(ref), args)
            const entry: Receiver = { key, receive, current: valueFor(key) }
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
        watchQuery: (ref: unknown, args?: unknown) => {
            const key = seedKey(nameOf(ref), args ?? {})
            const entry: Receiver = {
                key,
                receive: () => {},
                current: valueFor(key),
            }
            watchReceivers.add(entry)
            const forget = () => {
                watchReceivers.delete(entry)
            }
            return {
                localQueryResult: () => entry.current,
                onUpdate: (receive: (value: unknown) => void) => {
                    entry.receive = receive
                    return Object.assign(forget, { unsubscribe: forget })
                },
            }
        },
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only query stub standing in for client.query
        query: (async (ref: unknown, args: unknown) => {
            if (options.queryHook !== undefined) {
                return options.queryHook()
            }
            return valueFor(seedKey(nameOf(ref), args ?? {}))
        }) as ConvexReactClient["query"],
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only mutation recorder standing in for client.mutation
        mutation: (async (ref: unknown, args: unknown) => {
            await Promise.resolve()
            calls.push({ fn: nameOf(ref), args })
            return mutateResult
        }) as ConvexReactClient["mutation"],
    }

    const pushState = (rows: ReadonlyArray<unknown>, key?: string): void => {
        if (key === undefined) {
            liveRows = [...rows]
        } else {
            seeds.set(key, [...rows])
        }
        for (const entry of [...receivers, ...watchReceivers]) {
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

    const convexQueryClient = new ConvexQueryClient(
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only sync client standing in for the Convex subscription surface
        syncClient as unknown as ConvexReactClient,
    )
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                queryKeyHashFn: convexQueryClient.hashFn(),
                queryFn: convexQueryClient.queryFn(),
            },
        },
    })
    convexQueryClient.connect(queryClient)

    return {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only sync client standing in for the Convex subscription surface
        client: syncClient as unknown as ConvexReactClient,
        queryClient,
        pushState,
        subscriberCount: (): number => receivers.size + watchReceivers.size,
        failSync,
    }
}
