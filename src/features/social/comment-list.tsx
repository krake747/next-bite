import Trash2 from "lucide-react/icons/trash-2"
import { useState } from "react"

import { Button } from "@ui/button"

import { AvatarGroup } from "./avatar-group"

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
            <p className="text-sm font-medium text-stone-700">{formatCount(comments.length)}</p>
            {comments.length === 0 ? (
                <p className="text-sm text-stone-500">Nothing cooking just yet. Start the conversation.</p>
            ) : (
                <ul className="space-y-3">
                    {comments.map((comment) => (
                        <li key={comment.id} className="flex gap-2.5">
                            <AvatarGroup members={[{ name: comment.author, src: comment.authorSrc }]} max={1} />
                            <div className="min-w-0 flex-1 rounded-lg bg-stone-100 px-3 py-2">
                                <div className="flex items-baseline justify-between gap-2">
                                    <p className="truncate text-sm font-semibold text-stone-900">{comment.author}</p>
                                    <p className="shrink-0 text-xs text-stone-500">{comment.time}</p>
                                </div>
                                <p className="text-sm text-stone-800">{comment.text}</p>
                            </div>
                            {onDelete !== undefined && currentUser !== undefined && comment.author === currentUser && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        onDelete(comment.id)
                                    }}
                                    aria-label={`Delete comment by ${comment.author}`}
                                >
                                    <Trash2 className="size-4" aria-hidden="true" />
                                </Button>
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
                        placeholder="Add a comment..."
                        className="w-full rounded-control border border-stone-200 bg-surface px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
                    />
                    <Button type="submit" size="md" disabled={draft.trim() === ""}>
                        Post
                    </Button>
                </form>
            )}
        </div>
    )
}
