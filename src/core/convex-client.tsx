import { QueryClient, QueryClientProvider, useMutation, useQueryClient } from "@tanstack/react-query"
import { ConvexClient } from "convex/browser"
import { type FunctionArgs, type FunctionReference, type FunctionReturnType } from "convex/server"
import { createContext, useContext, useState, useEffect } from "react"

const ConvexContext = createContext<ConvexClient | null>(null)

const queryClient = new QueryClient()

function useConvexClient() {
    const client = useContext(ConvexContext)
    if (!client) {
        throw new Error("ConvexClient not provided. Wrap with ConvexProvider.")
    }
    return client
}

function ConvexProvider(props: Readonly<{ client: unknown; children: React.ReactNode }>) {
    if (!(props.client instanceof ConvexClient)) {
        throw new TypeError("ConvexClient not provided. Wrap with ConvexProvider.")
    }
    const client = props.client
    return (
        <QueryClientProvider client={queryClient}>
            <ConvexContext.Provider value={client}>{props.children}</ConvexContext.Provider>
        </QueryClientProvider>
    )
}

function useConvexQuery<Query extends FunctionReference<"query">>(
    query: Query,
    args?: FunctionArgs<Query>,
): FunctionReturnType<Query> | undefined {
    const client = useConvexClient()
    const queryClient = useQueryClient()
    const key = JSON.stringify(args)
    const queryKey = [query, key] as const

    const [data, setData] = useState<FunctionReturnType<Query> | undefined>(() => {
        return queryClient.getQueryData<FunctionReturnType<Query>>(queryKey)
    })

    useEffect(() => {
        const unsub = client.onUpdate(query, { ...args }, (value) => {
            queryClient.setQueryData<FunctionReturnType<Query>>(queryKey, value)
            setData(value)
        })
        return unsub
    }, [query, key])

    return data
}

function useConvexMutation<Mutation extends FunctionReference<"mutation">>(mutation: Mutation) {
    const client = useConvexClient()

    return useMutation({
        mutationFn: async (args: FunctionArgs<Mutation>) => {
            const response = await client.mutation(mutation, args)
            return response
        },
    })
}

function useConvexAction<Action extends FunctionReference<"action">>(action: Action) {
    const client = useConvexClient()

    return useMutation({
        mutationFn: async (args: FunctionArgs<Action>) => {
            const response = await client.action(action, args)
            return response
        },
    })
}

export { ConvexProvider, useConvexQuery, useConvexMutation, useConvexAction }
