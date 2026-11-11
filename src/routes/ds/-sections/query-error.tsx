import { QueryErrorState } from "@pattern/query-error"

import { Demo } from "./demo-frame"

export const queryErrorMeta = {
    id: "query-error",
    group: "Patterns",
    title: "Query Error",
    body: "A page that failed to load through no fault of the user. Name the failure in plain language and offer one way back, so a failed request reads as recoverable.",
    importPath: "src/pattern/query-error.tsx",
    props: [
        {
            name: "reset",
            type: "() => void",
            description: "Retries the failed load. The page stays mounted and the query runs again.",
        },
    ],
    guidance: {
        whenToUse:
            "Use when a route query fails and nothing on the page can render. Keep the user on the page with a single retry.",
        whenToAvoid:
            "Do not use for form validation or a single item that fails; the error stays next to the field or item that failed.",
        siblings: [
            { id: "empty-state", reason: "Empty results use EmptyState, failed requests use QueryError." },
            { id: "loading", reason: "Pending waits use Loading, failed waits use QueryError." },
        ],
    },
} as const

export function QueryErrorDemo() {
    return (
        <Demo>
            <QueryErrorState
                reset={() => {
                    // Docs demo: the button retries the query on a real page.
                }}
            />
        </Demo>
    )
}
