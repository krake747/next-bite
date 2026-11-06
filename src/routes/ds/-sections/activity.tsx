import { ActivityPost } from "@features/social/activity-post"
import { PhotoGallery } from "@features/social/photo-gallery"
import { Card } from "@ui/card"

export const activityMeta = {
    id: "activity",
    group: "Social",
    title: "Activity and photos",
    body: "A feed post reads like a friend's discovery. Galleries attribute every photo and open the shared viewer.",
} as const

const noop = () => {}

export function ActivityDemo() {
    return (
        <Card>
            <div className="w-full max-w-xl space-y-4 p-5">
                <ActivityPost
                    author={{ name: "Alex" }}
                    time="2 hours ago"
                    text="You have to try this place."
                    restaurant={{ name: "Trattoria Verde", cuisine: "Italian" }}
                    social={{ ownerName: "Alex", wantCount: 4, interestedNames: ["Priya", "Jamie"] }}
                    reactions={{
                        liked: false,
                        likeCount: 3,
                        onToggleLike: noop,
                        commentCount: 2,
                        onComment: noop,
                        wanted: true,
                        wantCount: 4,
                        onToggleWant: noop,
                    }}
                />
                <PhotoGallery
                    photos={[
                        { url: "https://picsum.photos/seed/nextbite1/400", author: "Alex" },
                        { url: "https://picsum.photos/seed/nextbite2/400", author: "Priya" },
                        { url: "https://picsum.photos/seed/nextbite3/400" },
                    ]}
                />
            </div>
        </Card>
    )
}
