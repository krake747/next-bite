import { queryOptions } from "@tanstack/react-query"
import { type FunctionArgs, type FunctionReference } from "convex/server"

import { convexQuery } from "@convex-dev/react-query"

export function convexQueryOptions<Query extends FunctionReference<"query">>(query: Query, args?: FunctionArgs<Query>) {
    const shaped = convexQuery(query, (args ?? {}) as FunctionArgs<Query>)
    return queryOptions({
        queryKey: shaped.queryKey,
        staleTime: shaped.staleTime ?? Infinity,
    })
}
