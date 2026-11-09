import { CircleNotchIcon } from "@phosphor-icons/react"

export function LoadingPlaceholder() {
    return (
        <div role="status" aria-label="Loading" className="flex w-full items-center justify-center py-16">
            <CircleNotchIcon className="size-7 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
    )
}
