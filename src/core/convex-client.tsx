import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ConvexClient } from "convex/browser"
import { type FunctionArgs, type FunctionReference, type FunctionReturnType } from "convex/server"
import { getFunctionName } from "convex/server"
import { createContext, useContext, useState, useEffect } from "react"

const ConvexContext = createContext<ConvexClient | null>(null)

function ConvexProvider({ client, children }: Readonly<{ client: ConvexClient | null; children: React.ReactNode }>) {
    return <ConvexContext.Provider value={client}>{children}</ConvexContext.Provider>
}

export function convexQueryKey<Query extends FunctionReference<"query">>(
    query: Query,
    args: FunctionArgs<Query> | undefined,
): readonly [string, string] {
    // Convex function references are fresh proxies on every access with no
    // enumerable identity, so every reference hashes the same under TanStack
    // Query. The function path keeps cache entries apart and keeps the
    // subscription effect from refiring on every render.
    return [getFunctionName(query), JSON.stringify(args) ?? "no-args"]
}

function useConvexQuery<Query extends FunctionReference<"query">>(
    query: Query,
    args?: FunctionArgs<Query>,
    options?: Readonly<{ skip?: boolean | undefined }>,
): FunctionReturnType<Query> | undefined {
    const client = useContext(ConvexContext)
    const queryClient = useQueryClient()
    const [namespace, argsKey] = convexQueryKey(query, args)
    const queryKey = [namespace, argsKey] as const
    const skip = options?.skip ?? false

    const [data, setData] = useState<FunctionReturnType<Query> | undefined>(() => {
        return skip ? undefined : queryClient.getQueryData<FunctionReturnType<Query>>(queryKey)
    })

    useEffect(() => {
        const unsub =
            skip || client === null
                ? undefined
                : client.onUpdate(query, { ...args }, (value) => {
                      queryClient.setQueryData<FunctionReturnType<Query>>(queryKey, value)
                      setData(value)
                  })
        return unsub
    }, [namespace, argsKey, client, skip])

    return skip ? undefined : data
}

function useConvexMutation<Mutation extends FunctionReference<"mutation">>(mutation: Mutation) {
    const client = useContext(ConvexContext)

    return useMutation({
        mutationFn: async (args: FunctionArgs<Mutation>) => {
            if (client === null) {
                throw new Error("ConvexClient not provided. Wrap with ConvexProvider.")
            }
            const response = await client.mutation(mutation, args)
            return response
        },
    })
}

function useConvexAction<Action extends FunctionReference<"action">>(action: Action) {
    const client = useContext(ConvexContext)

    return useMutation({
        mutationFn: async (args: FunctionArgs<Action>) => {
            if (client === null) {
                throw new Error("ConvexClient not provided. Wrap with ConvexProvider.")
            }
            const response = await client.action(action, args)
            return response
        },
    })
}

function useConvexClient(): ConvexClient | null {
    return useContext(ConvexContext)
}

export { ConvexProvider, useConvexClient, useConvexQuery, useConvexMutation, useConvexAction }
