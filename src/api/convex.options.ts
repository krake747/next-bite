import { noop, queryOptions, type QueryClient, type QueryExecuteOptions } from "@tanstack/react-query"
import { type FunctionArgs, type FunctionReference } from "convex/server"

import { convexQuery } from "@convex-dev/react-query"

export function convexQueryOptions<Query extends FunctionReference<"query">>(
    query: Query,
    args?: FunctionArgs<Query>,
    options?: Readonly<{ skip?: boolean | undefined }>,
) {
    // Skipped queries must carry the library's "skip" marker, not an empty
    // args object: the connector subscribes cache entries by key shape alone,
    // so a `{}` key would hit the backend (and fail validation) even while
    // TanStack stays `enabled: false`.
    const shaped =
        options?.skip === true
            ? convexQuery(query, "skip" as const)
            : convexQuery(query, (args ?? {}) as FunctionArgs<Query>)
    return queryOptions({
        queryKey: shaped.queryKey,
        staleTime: shaped.staleTime ?? Infinity,
    })
}

// Best-effort warm-up only: the Suspense views below refetch on their own when this has not
// landed, so a failed warm-up stays silent by design. Server renderers carry no default
// query function, so warming there is skipped up front instead of failing noisily.
function startWarming(queryClient: QueryClient, options: ReadonlyArray<object>): Promise<void>[] {
    if (queryClient.getDefaultOptions().queries?.queryFn === undefined) {
        return []
    }
    return options.map(async (option) => {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- heterogeneous queryOptions share no static annotation, each is type-checked where built
        await queryClient.query(option as QueryExecuteOptions).catch(noop)
    })
}

export function warmQueries(queryClient: QueryClient, options: ReadonlyArray<object>): void {
    void Promise.all(startWarming(queryClient, options))
}

export async function warmQueriesWithin(
    queryClient: QueryClient,
    options: ReadonlyArray<object>,
    budgetMs: number,
): Promise<void> {
    const warming = startWarming(queryClient, options)
    if (warming.length === 0) {
        return
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    const budget = new Promise<void>((resolve) => {
        timer = setTimeout(resolve, budgetMs)
    })
    await Promise.race([Promise.all(warming), budget])
    clearTimeout(timer)
}
