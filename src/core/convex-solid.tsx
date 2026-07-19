import { ConvexClient } from "convex/browser"
import { type FunctionReference } from "convex/server"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

const ConvexContext = createContext<ConvexClient | null>(null)

function useConvexClient() {
    const client = useContext(ConvexContext)
    if (!client) {
        throw new Error("ConvexClient not provided. Wrap with ConvexProvider.")
    }
    return client
}

function ConvexProvider({ client, children }: { client: ConvexClient; children: ReactNode }) {
    return <ConvexContext.Provider value={client}>{children}</ConvexContext.Provider>
}

function useConvexQuery<T>(query: FunctionReference<"query">, args?: {}): T | undefined {
    const client = useConvexClient()
    const queryClient = useQueryClient()
    const key = JSON.stringify(args)
    const queryKey = [query, key] as const

    const [data, setData] = useState<T | undefined>(() => {
        return queryClient.getQueryData(queryKey) as T | undefined
    })

    useEffect(() => {
        const unsub = client.onUpdate(query, args ?? {}, (value: T) => {
            queryClient.setQueryData(queryKey, value)
            setData(value)
        })
        return unsub
    }, [query, key])

    return data
}

function useConvexMutation<T>(mutation: FunctionReference<"mutation">) {
    const client = useConvexClient()

    return useMutation({
        mutationFn: async (args?: {}): Promise<T> => {
            return client.mutation(mutation, args ?? {}) as Promise<T>
        },
    })
}

function useConvexAction<T>(action: FunctionReference<"action">) {
    const client = useConvexClient()

    return useMutation({
        mutationFn: async (args?: {}): Promise<T> => {
            return client.action(action, args ?? {}) as Promise<T>
        },
    })
}

export {
    ConvexContext,
    ConvexProvider,
    useConvexClient,
    useConvexQuery,
    useConvexMutation,
    useConvexAction,
}
