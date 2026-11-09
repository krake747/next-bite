import { BookmarkIcon, ChatCircleIcon, HeartIcon } from "@phosphor-icons/react"

import { cx } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

type ReactionButtonProps = Readonly<{
    pressed: boolean
    count: number
    label: string
    onToggle: () => void
    children: React.ReactNode
}>

function ReactionButton({ pressed, count, label, onToggle, children }: ReactionButtonProps) {
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

export type Reactions = {
    readonly liked: boolean
    readonly likeCount: number
    readonly onToggleLike: () => void
    readonly commentCount: number
    readonly onComment: () => void
    readonly wanted: boolean
    readonly wantCount: number
    readonly onToggleWant: () => void
}

export function ReactionBar({ reactions }: Readonly<{ reactions: Reactions }>) {
    const { liked, likeCount, onToggleLike, commentCount, onComment, wanted, wantCount, onToggleWant } = reactions
    return (
        <div className="flex items-center gap-1" role="group" aria-label="Reactions">
            <ReactionButton pressed={liked} count={likeCount} label="Like" onToggle={onToggleLike}>
                <HeartIcon className="size-4" weight={liked ? "fill" : "regular"} aria-hidden="true" />
            </ReactionButton>
            <ReactionButton pressed={false} count={commentCount} label="Comments" onToggle={onComment}>
                <ChatCircleIcon className="size-4" aria-hidden="true" />
            </ReactionButton>
            <ReactionButton pressed={wanted} count={wantCount} label="Want to try" onToggle={onToggleWant}>
                <BookmarkIcon className="size-4" weight={wanted ? "fill" : "regular"} aria-hidden="true" />
            </ReactionButton>
        </div>
    )
}
