import { useSessionStatus } from "@core/session"
import { Button } from "@ui/button"

export function SessionTimeoutNotice() {
    const status = useSessionStatus()
    if (status.kind !== "timed-out") {
        return null
    }
    return (
        <div role="alert" className="border-b border-border bg-surface">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-2">
                <p className="text-sm text-muted-foreground">We could not reach your data. Nothing was lost.</p>
                <Button type="button" tone="secondary" size="sm" onClick={status.retry}>
                    Try again
                </Button>
            </div>
        </div>
    )
}
