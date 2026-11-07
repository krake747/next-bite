import { CommentList } from "@features/social/comment-list"
import { ReactionBar } from "@features/social/reaction-bar"
import { SocialMetadata } from "@pattern/social-metadata"
import { Card } from "@ui/card"

export const socialMeta = {
    id: "social",
    group: "Social",
    title: "Social primitives",
    body: "Human language over database terms. Counts update optimistically in the app; here the callbacks are illustrative.",
} as const

const noop = () => {}

export function SocialDemo() {
    return (
        <Card>
            <div className="w-full space-y-4 p-5">
                <SocialMetadata ownerName="Alex" wantCount={4} beenCount={1} />
                <ReactionBar
                    reactions={{
                        liked: true,
                        likeCount: 3,
                        onToggleLike: noop,
                        commentCount: 2,
                        onComment: noop,
                        wanted: true,
                        wantCount: 4,
                        onToggleWant: noop,
                    }}
                />
                <CommentList
                    comments={[
                        { id: "c1", author: "Alex", text: "The pasta is unreal.", time: "2h ago" },
                        { id: "c2", author: "Priya", text: "Going Friday!", time: "1h ago" },
                    ]}
                    currentUser="Alex"
                    onAdd={noop}
                    onDelete={noop}
                />
            </div>
        </Card>
    )
}
