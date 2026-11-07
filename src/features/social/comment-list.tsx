import { TrashIcon } from "@phosphor-icons/react"
import { useState } from "react"

import { AvatarGroup } from "@pattern/avatar-group"
import { Button } from "@ui/button"
import { cx } from "@ui/cva.config"
import { IconButton } from "@ui/icon-button"
import { control } from "@ui/variants"

export type SocialComment = {
    readonly id: string
    readonly author: string
    readonly authorSrc?: string | undefined
    readonly text: string
    readonly time: string
}

function formatCount(count: number): string {
    return count === 1 ? "1 comment" : `${count} comments`
}

export function CommentList({
    comments,
    currentUser,
    onAdd,
    onDelete,
}: Readonly<{
    comments: ReadonlyArray<SocialComment>
    currentUser?: string | undefined
    onAdd?: ((text: string) => void) | undefined
    onDelete?: ((id: string) => void) | undefined
}>) {
    const [draft, setDraft] = useState("")

    return (
        <div className="space-y-3">
            <p className="text-sm font-medium text-foreground tabular-nums">{formatCount(comments.length)}</p>
            {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing cooking just yet. Start the conversation.</p>
            ) : (
                <ul className="space-y-3">
                    {comments.map((comment) => (
                        <li key={comment.id} className="flex gap-2.5">
                            <AvatarGroup members={[{ name: comment.author, src: comment.authorSrc }]} max={1} />
                            <div className="min-w-0 flex-1 rounded-lg bg-surface-muted px-3 py-2">
                                <div className="flex items-baseline justify-between gap-2">
                                    <p
                                        className="truncate text-sm font-semibold text-foreground"
                                        title={comment.author}
                                    >
                                        {comment.author}
                                    </p>
                                    <p className="shrink-0 text-xs text-muted-foreground">{comment.time}</p>
                                </div>
                                <p className="text-sm leading-relaxed text-foreground">{comment.text}</p>
                            </div>
                            {onDelete !== undefined && currentUser !== undefined && comment.author === currentUser && (
                                <IconButton
                                    label={`Delete comment by ${comment.author}`}
                                    tone="plain"
                                    onClick={() => {
                                        onDelete(comment.id)
                                    }}
                                >
                                    <TrashIcon className="size-4" />
                                </IconButton>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {onAdd !== undefined && (
                <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                        event.preventDefault()
                        const text = draft.trim()
                        if (text !== "") {
                            onAdd(text)
                            setDraft("")
                        }
                    }}
                >
                    <label htmlFor="comment-draft" className="sr-only">
                        Write a comment
                    </label>
                    <input
                        id="comment-draft"
                        type="text"
                        value={draft}
                        onChange={(event) => {
                            setDraft(event.currentTarget.value)
                        }}
                        placeholder="Add a comment…"
                        className={cx(control(), "text-base md:text-sm")}
                    />
                    <Button type="submit" size="md" disabled={draft.trim() === ""}>
                        Post
                    </Button>
                </form>
            )}
        </div>
    )
}
