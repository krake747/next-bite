import { BookmarkIcon } from "@phosphor-icons/react"

import { cx } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

type WantButtonProps = Readonly<{
    pressed: boolean
    count: number | string
    label: string
    onToggle: () => void
    children: React.ReactNode
}>

function WantButton({ pressed, count, label, onToggle, children }: WantButtonProps) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={pressed}
            aria-label={`${label}, ${count}`}
            className={cx(
                focusRing(),
                "hit-area-2 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-sm",
                pressed ? "text-primary" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
            )}
        >
            {children}
            <span className="text-xs font-medium tabular-nums">{count}</span>
        </button>
    )
}

export type WantState = {
    readonly wanted: boolean
    readonly wantCount: number | string
    readonly onToggleWant: () => void
}

export function WantBar({ want }: Readonly<{ want: WantState }>) {
    const { wanted, wantCount, onToggleWant } = want
    return (
        <div className="flex items-center gap-1" role="group" aria-label="Want">
            <WantButton pressed={wanted} count={wantCount} label="Want to try" onToggle={onToggleWant}>
                <BookmarkIcon className="size-4" weight={wanted ? "fill" : "regular"} aria-hidden="true" />
            </WantButton>
        </div>
    )
}
