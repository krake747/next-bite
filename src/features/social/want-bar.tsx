import { BookmarkIcon, CheckIcon } from "@phosphor-icons/react"

import { cx } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

type WantButtonProps = Readonly<{
    pressed: boolean
    count?: number | string | undefined
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
            aria-label={count === undefined ? label : `${label}, ${count}`}
            className={cx(
                focusRing(),
                "hit-area-2 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-sm",
                pressed ? "text-primary" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
            )}
        >
            {children}
            {count !== undefined && <span className="text-xs font-medium tabular-nums">{count}</span>}
        </button>
    )
}

export type WantState = {
    readonly wanted: boolean
    readonly tried: boolean
    readonly wantCount: number | string
    readonly onToggleWant: () => void
    readonly onToggleBeen: () => void
}

export function WantBar({ want }: Readonly<{ want: WantState }>) {
    const { wanted, tried, wantCount, onToggleWant, onToggleBeen } = want
    return (
        <div className="flex items-center gap-1" role="group" aria-label="Want">
            <WantButton pressed={wanted} count={wantCount} label="Want to try" onToggle={onToggleWant}>
                <BookmarkIcon className="size-4" weight={wanted ? "fill" : "regular"} aria-hidden="true" />
            </WantButton>
            <WantButton pressed={tried} label="Been there" onToggle={onToggleBeen}>
                <CheckIcon className="size-4" weight={tried ? "fill" : "regular"} aria-hidden="true" />
            </WantButton>
        </div>
    )
}
