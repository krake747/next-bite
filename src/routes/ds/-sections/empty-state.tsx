import { EmptyState } from "@pattern/empty-state"

import { Demo } from "./demo-frame"

export const emptyStateMeta = {
    id: "empty-state",
    group: "Patterns",
    title: "Empty State",
    body: "A list with nothing in it yet. Name what belongs here and how to add the first item, so an empty list reads as an invitation, not a dead end.",
    importPath: "src/pattern/empty-state.tsx",
    props: [
        {
            name: "title",
            type: "string",
            description: "The headline. Names what is missing in plain words.",
        },
        {
            name: "body",
            type: "string",
            description: "The follow-up with the next step. Omit it when the title already says enough.",
        },
        {
            name: "className",
            type: "string",
            description: "Layout overrides at the call site. The card styling stays untouched.",
        },
    ],
    guidance: {
        whenToUse: "Use when a list or collection loads fine but holds zero items, and the user can add the first one.",
        whenToAvoid:
            "Do not use for loading waits or failed requests; those get a skeleton or the query error pattern instead.",
        siblings: [
            { id: "loading", reason: "Waits with no shape use Loading, empty results use EmptyState." },
            { id: "query-error", reason: "Failed requests use QueryError, empty results use EmptyState." },
        ],
    },
} as const

export function EmptyStateDemo() {
    return (
        <Demo className="space-y-4">
            <EmptyState title="No lists yet" body="Save your first restaurant to start a list." />
            <EmptyState title="No friends yet" />
        </Demo>
    )
}
