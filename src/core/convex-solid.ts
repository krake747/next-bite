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
        const safeSetter = (value: T) => {
            try {
                setter(value)
            } catch (error) {
                console.error("Error in query setter:", error)
                setter(undefined)
            }
        }
        const unsubber = convex.onUpdate(query, args ?? {}, safeSetter)
        return unsubber
    })
}

export function createMutation<T>(mutation: FunctionReference<"mutation">): (args?: {}) => Promise<T> {
    const convex = useContext(ConvexContext)
    if (convex === undefined) {
        throw new Error("No convex context")
    }

    return async (args) => {
        try {
            return await convex.mutation(mutation, args ?? {})
        } catch (error) {
            console.error("Error in mutation:", error)
            throw error
        }
    }
}

export function createAction<T>(action: FunctionReference<"action">): (args?: {}) => Promise<T> {
    const convex = useContext(ConvexContext)
    if (convex === undefined) {
        throw new Error("No convex context")
    }

    return async (args) => {
        try {
            return await convex.action(action, args ?? {})
        } catch (error) {
            console.error("Error in action:", error)
            throw error
        }
    }
}
