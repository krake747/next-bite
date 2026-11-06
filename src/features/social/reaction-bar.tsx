import Bookmark from "lucide-react/icons/bookmark"
import Heart from "lucide-react/icons/heart"
import MessageCircle from "lucide-react/icons/message-circle"

import { cx } from "@ui/cva.config"

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
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-sm transition-colors",
                pressed ? "text-tomato-700" : "text-stone-600 hover:bg-stone-100 hover:text-stone-700",
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
                <Heart className={cx("size-4", liked && "fill-current")} aria-hidden="true" />
            </ReactionButton>
            <ReactionButton pressed={false} count={commentCount} label="Comments" onToggle={onComment}>
                <MessageCircle className="size-4" aria-hidden="true" />
            </ReactionButton>
            <ReactionButton pressed={wanted} count={wantCount} label="Want to try" onToggle={onToggleWant}>
                <Bookmark className={cx("size-4", wanted && "fill-current")} aria-hidden="true" />
            </ReactionButton>
        </div>
    )
}
