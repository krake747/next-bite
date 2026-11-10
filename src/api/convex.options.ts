import { noop, queryOptions, type QueryClient, type QueryExecuteOptions } from "@tanstack/react-query"
import { type FunctionArgs, type FunctionReference } from "convex/server"

import { convexQuery } from "@convex-dev/react-query"

export function convexQueryOptions<Query extends FunctionReference<"query">>(
    query: Query,
    args?: FunctionArgs<Query>,
    options?: Readonly<{ skip?: boolean | undefined }>,
) {
    // See ADR-0025: unready work stays disabled, never placeholder args.
    const shaped =
        options?.skip === true
            ? convexQuery(query, "skip" as const)
            : convexQuery(query, (args ?? {}) as FunctionArgs<Query>)
    return queryOptions({
        queryKey: shaped.queryKey,
        staleTime: shaped.staleTime ?? Infinity,
    })
}

// Warm-up is best-effort; views refetch, server skips without queryFn.
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
