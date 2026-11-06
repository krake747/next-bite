import { type ConvexClient } from "convex/browser"
import { getFunctionName } from "convex/server"

export type SeedMap = Map<string, unknown>
export type MutationCall = { fn: string; args: unknown }

export function seedKey(fn: string, args: unknown): string {
    const raw = JSON.stringify(args) ?? "no-args"
    // Subscriptions spread args ({...undefined} is {}), while the cache keys the unspread
    // value. No caller passes an explicit {}, so both spellings address the same seed.
    return `${fn}|${raw === "{}" ? "no-args" : raw}`
}

// Test-only Convex client: serves seeded query results by function path plus args and records
// mutations by function path. Stands in for the Convex subscription surface where the real
// AuthProvider would otherwise shadow injected values with a live client.
export function createSeededClient(seeds: SeedMap, calls: MutationCall[], mutateResult: unknown = "m1"): ConvexClient {
    const queryStub: unknown = async () => {
        await Promise.resolve()
        return []
    }
    const mutationStub: unknown = async (ref: unknown, args: unknown) => {
        await Promise.resolve()
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only function reference shaped to the Convex subscription surface
        calls.push({ fn: getFunctionName(ref as never), args })
        return mutateResult
    }
    const syncClient = {
        onUpdate: (ref: unknown, args: unknown, receive: (result: unknown) => void) => {
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only function reference shaped to the Convex subscription surface
            const rows = seeds.get(seedKey(getFunctionName(ref as never), args))
            receive(rows === undefined ? [] : structuredClone(rows))
            const unsub: () => void = () => {}
            return Object.assign(unsub, {
                unsubscribe: () => {},
                getCurrentValue: () => null,
            })
        },
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only query stub standing in for client.query
        query: queryStub as ConvexClient["query"],
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only mutation recorder standing in for client.mutation
        mutation: mutationStub as ConvexClient["mutation"],
    }
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only sync client standing in for the Convex subscription surface
    return syncClient as unknown as ConvexClient
}
