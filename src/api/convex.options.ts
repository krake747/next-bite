import { noop, queryOptions, type QueryClient, type QueryExecuteOptions } from "@tanstack/react-query"
import { type FunctionArgs, type FunctionReference } from "convex/server"

import { convexQuery } from "@convex-dev/react-query"

export function convexQueryOptions<Query extends FunctionReference<"query">>(query: Query, args?: FunctionArgs<Query>) {
    const shaped = convexQuery(query, (args ?? {}) as FunctionArgs<Query>)
    return queryOptions({
        queryKey: shaped.queryKey,
        staleTime: shaped.staleTime ?? Infinity,
    })
}

// Best-effort warm-up only: the Suspense views below refetch on their own when this has not
// landed, so a failed warm-up stays silent by design.
export function warmQueries(queryClient: QueryClient, options: ReadonlyArray<object>): void {
    for (const option of options) {
        // Heterogeneous queryOptions outputs share no single static annotation (their tuple keys
        // are invariant), so the one shaping cast lives here; each option type-checked where built.
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- sanctioned shaping cast, see above
        void queryClient.query(option as QueryExecuteOptions).catch(noop)
    }
}
