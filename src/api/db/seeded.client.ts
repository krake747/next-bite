import { QueryClient } from "@tanstack/react-query"
import { type ConvexReactClient } from "convex/react"
import { getFunctionName } from "convex/server"

import { convexArgsKey } from "@api/convex.context"
import { ConvexQueryClient } from "@convex-dev/react-query"

export type SeedMap = Map<string, unknown>
export type MutationCall = { fn: string; args: unknown }

export function seedKey(fn: string, args: unknown): string {
    return `${fn}|${convexArgsKey(args)}`
}

export type SeededClientOptions = {
    readonly seeds?: SeedMap | undefined
    readonly calls?: MutationCall[] | undefined
    readonly mutateResult?: unknown
    readonly actionCalls?: MutationCall[] | undefined
    readonly liveRows?: ReadonlyArray<unknown> | undefined
    readonly queryHook?: (() => Promise<unknown>) | undefined
    readonly queryGate?: (() => Promise<void>) | undefined
}

type Receiver = {
    key: string
    receive: (value: unknown) => void
    current: unknown
}

export function createSeededClient(options: SeededClientOptions = {}) {
    const seeds = options.seeds ?? new Map<string, unknown>()
    const calls = options.calls ?? []
    const mutateResult = options.mutateResult ?? "m1"
    const actionCalls = options.actionCalls ?? []
    let liveRows: ReadonlyArray<unknown> = options.liveRows === undefined ? [] : [...options.liveRows]
    const receivers = new Set<Receiver>()
    const watchReceivers = new Set<Receiver>()
    const failers = new Map<string, Set<(error: unknown) => void>>()
    let broken: { readonly error: unknown } | null = null
    const severers = new Map<(error: unknown) => void, () => void>()

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
            if (broken !== null && typeof onError === "function") {
                const { error } = broken
                queueMicrotask(() => {
                    onError(error)
                })
                return Object.assign(() => {}, { unsubscribe: () => {}, getCurrentValue: () => null })
            }
            const entry: Receiver = { key, receive, current: valueFor(key) }
            receivers.add(entry)
            trackFailureHandler(key, onError)
            receive(entry.current)
            const forget = () => {
                receivers.delete(entry)
                untrackFailureHandler(key, onError)
            }
            if (typeof onError === "function") {
                severers.set(onError, forget)
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
            if (options.queryGate !== undefined) {
                await options.queryGate()
            }
            return valueFor(seedKey(nameOf(ref), args ?? {}))
        }) as ConvexReactClient["query"],
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only mutation recorder standing in for client.mutation
        mutation: (async (ref: unknown, args: unknown) => {
            await Promise.resolve()
            calls.push({ fn: nameOf(ref), args })
            return mutateResult
        }) as ConvexReactClient["mutation"],
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only action stub serving seeded results by function and args
        action: (async (ref: unknown, args: unknown) => {
            await Promise.resolve()
            const fn = nameOf(ref)
            actionCalls.push({ fn, args })
            const key = seedKey(fn, args ?? {})
            if (!seeds.has(key)) {
                throw new Error(`Unseeded action: ${key}`)
            }
            return valueFor(key)
        }) as ConvexReactClient["action"],
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

    const failSync = (error: unknown = new Error("Convex subscription failed")): void => {
        for (const set of failers.values()) {
            for (const fail of set) {
                severers.get(fail)?.()
                severers.delete(fail)
                fail(error)
            }
        }
    }

    const breakSync = (error: unknown = new Error("Convex subscription failed")): void => {
        broken = { error }
        failSync(error)
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
        subscribedQueries: (): string[] => [...receivers, ...watchReceivers].map((entry) => entry.key),
        failSync,
        breakSync,
    }
}
