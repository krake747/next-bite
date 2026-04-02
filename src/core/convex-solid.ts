import { ConvexClient } from "convex/browser"
import { type FunctionReference } from "convex/server"
import { type Context } from "solid-js"
import { createContext, from, useContext } from "solid-js"

export const ConvexContext: Context<ConvexClient | undefined> = createContext()

export function createQuery<T>(query: FunctionReference<"query">, args?: {}): () => T | undefined {
    const convex = useContext(ConvexContext)
    if (convex === undefined) {
        throw new Error("No convex context")
    }

    return from((setter: (value: T | undefined) => void) => {
        const unsubber = convex.onUpdate(query, args ?? {}, setter)
        return unsubber
    })
}

export function createMutation<T>(mutation: FunctionReference<"mutation">): (args?: {}) => Promise<T> {
    const convex = useContext(ConvexContext)
    if (convex === undefined) {
        throw new Error("No convex context")
    }

    return async (args) => {
        return await convex.mutation(mutation, args ?? {})
    }
}

export function createAction<T>(action: FunctionReference<"action">): (args?: {}) => Promise<T> {
    const convex = useContext(ConvexContext)
    if (convex === undefined) {
        throw new Error("No convex context")
    }

    return async (args) => {
        return await convex.action(action, args ?? {})
    }
}
