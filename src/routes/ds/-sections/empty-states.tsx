import { EmptyRestaurantsState } from "@features/restaurants/empty-restaurants-state"
import { Card } from "@ui/card"

export const emptyStatesMeta = {
    id: "empty-states",
    group: "Content",
    title: "Empty states",
    body: "Friendly and actionable, never error-like. Each one tells the user what to do next.",
} as const

const noop = () => {}

export function EmptyStatesDemo() {
    return (
        <Card>
            <div className="w-full p-5">
                <EmptyRestaurantsState hasFilter={false} hasSearch={false} onAddClick={noop} />
            </div>
        </Card>
    )
}
