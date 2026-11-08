import { useMutation, useQuery, useSuspenseQuery, mutationOptions } from "@tanstack/react-query"
import { type ConvexReactClient } from "convex/react"
import { type FunctionArgs, type FunctionReference, type FunctionReturnType } from "convex/server"
import { createContext, use } from "react"

import { convexQueryOptions } from "./convex.options"

const ConvexContext = createContext<ConvexReactClient | null>(null)

export function ConvexProvider({
    client,
    children,
}: Readonly<{ client: ConvexReactClient | null; children: React.ReactNode }>) {
    return <ConvexContext.Provider value={client}>{children}</ConvexContext.Provider>
}

export function convexArgsKey(args: unknown): string {
    const raw = JSON.stringify(args) ?? "no-args"
    return raw === "{}" ? "no-args" : raw
}

export function useConvexQuery<Query extends FunctionReference<"query">>(
    query: Query,
    args?: FunctionArgs<Query>,
    options?: Readonly<{ skip?: boolean | undefined }>,
): FunctionReturnType<Query> | undefined {
    return useConvexQueryResult(query, args, options).data
}

function useConvexQueryResult<Query extends FunctionReference<"query">>(
    query: Query,
    args?: FunctionArgs<Query>,
    options?: Readonly<{ skip?: boolean | undefined }>,
): Readonly<{ data: FunctionReturnType<Query> | undefined; isPending: boolean; isError: boolean }> {
    const client = use(ConvexContext)
    // Null client means server render (or a tree without a provider): stay
    // disabled so no queryFn is needed, matching the old loading state.
    const skip = options?.skip ?? client === null
    const result = useQuery({
        ...convexQueryOptions(query, args),
        enabled: !skip,
    })
    if (skip) {
        return { data: undefined, isPending: false, isError: false }
    }
    return { data: result.data, isPending: result.isPending, isError: result.isError }
}

export function useSuspenseConvexQuery<Query extends FunctionReference<"query">>(
    query: Query,
    args?: FunctionArgs<Query>,
): FunctionReturnType<Query> {
    const client = use(ConvexContext)
    if (client === null) {
        throw new Error("useSuspenseConvexQuery needs a connected Convex client; render below a ready session gate.")
    }
    return useSuspenseQuery(convexQueryOptions(query, args)).data
}

export function useConvexMutation<Mutation extends FunctionReference<"mutation">>(mutation: Mutation) {
    const client = use(ConvexContext)

    return useMutation(
        mutationOptions({
            mutationFn: async (args: FunctionArgs<Mutation>) => {
                if (client === null) {
                    throw new Error("ConvexClient not provided. Wrap with ConvexProvider.")
                }
                const response = await client.mutation(mutation, args)
                return response
            },
        }),
    )
}

export function useConvexAction<Action extends FunctionReference<"action">>(action: Action) {
    const client = use(ConvexContext)

    return useMutation(
        mutationOptions({
            mutationFn: async (args: FunctionArgs<Action>) => {
                if (client === null) {
                    throw new Error("ConvexClient not provided. Wrap with ConvexProvider.")
                }
                const response = await client.action(action, args)
                return response
            },
        }),
    )
}

export function useConvexClient(): ConvexReactClient | null {
    return use(ConvexContext)
}
