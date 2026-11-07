import { EmptyState } from "@pattern/empty-state"
import { Button } from "@ui/button"

export function QueryErrorState({ reset }: Readonly<{ reset: () => void }>) {
    return (
        <div className="pt-6">
            <EmptyState
                title="Could not load this page"
                body="The request failed. Check your connection and try again."
            />
            <div className="pt-4 text-center">
                <Button tone="secondary" onClick={reset}>
                    Try again
                </Button>
            </div>
        </div>
    )
}
