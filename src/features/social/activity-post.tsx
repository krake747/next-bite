import { AvatarGroup, type AvatarMember } from "@pattern/avatar-group"
import { LazyImage } from "@pattern/lazy-image"

import { ReactionBar } from "./reaction-bar"
import { SocialMetadata } from "./social-metadata"

export type ActivityAuthor = {
    readonly name: string
    readonly src?: string | undefined
}

function ActivityAuthorHeader({ author, time }: Readonly<{ author: ActivityAuthor; time: string }>) {
    return (
        <div className="flex items-center gap-3 p-4 pb-0">
            <AvatarGroup members={[{ name: author.name, src: author.src }]} max={1} />
            <div>
                <p className="text-sm font-semibold text-stone-900">{author.name}</p>
                <p className="text-xs text-stone-600">{time}</p>
            </div>
        </div>
    )
}

function ActivityRestaurant({
    name,
    cuisine,
    photoUrls,
}: Readonly<{
    name: string
    cuisine?: string | undefined
    photoUrls?: ReadonlyArray<string> | undefined
}>) {
    const cover = photoUrls?.[0]
    const showCover = cover !== undefined && cover !== ""
    return (
        <div className="space-y-2">
            {showCover && <LazyImage src={cover} alt={name} aspectRatio="16/9" className="rounded-lg" />}
            <div>
                <p className="font-display text-lg font-semibold text-balance text-stone-900">{name}</p>
                {cuisine !== undefined && cuisine !== "" && <p className="text-sm text-stone-600">{cuisine}</p>}
            </div>
        </div>
    )
}

type ActivityReactions = {
    readonly liked: boolean
    readonly likeCount: number
    readonly onToggleLike: () => void
    readonly commentCount: number
    readonly onComment: () => void
    readonly wanted: boolean
    readonly wantCount: number
    readonly onToggleWant: () => void
}

const idleReactions: ActivityReactions = {
    liked: false,
    likeCount: 0,
    onToggleLike: () => {},
    commentCount: 0,
    onComment: () => {},
    wanted: false,
    wantCount: 0,
    onToggleWant: () => {},
}

export function ActivityPost({
    author,
    time,
    text,
    restaurantName,
    restaurantCuisine,
    photoUrls,
    ownerName,
    wantCount,
    beenCount,
    interestedFriends,
    reactions,
}: Readonly<{
    author: ActivityAuthor
    time: string
    text: string
    restaurantName: string
    restaurantCuisine?: string | undefined
    photoUrls?: ReadonlyArray<string> | undefined
    ownerName?: string | undefined
    wantCount?: number | undefined
    beenCount?: number | undefined
    interestedFriends?: ReadonlyArray<AvatarMember> | undefined
    reactions?: ActivityReactions | undefined
}>) {
    const active = reactions ?? idleReactions
    const friends = interestedFriends ?? []
    return (
        <article className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <ActivityAuthorHeader author={author} time={time} />
            <div className="space-y-3 p-4">
                <p className="text-body text-stone-800">{text}</p>
                <ActivityRestaurant name={restaurantName} cuisine={restaurantCuisine} photoUrls={photoUrls} />
                <SocialMetadata ownerName={ownerName} wantCount={wantCount} beenCount={beenCount} />
                {friends.length > 0 && <AvatarGroup members={friends} />}
                <ReactionBar
                    liked={active.liked}
                    likeCount={active.likeCount}
                    onToggleLike={active.onToggleLike}
                    commentCount={active.commentCount}
                    onComment={active.onComment}
                    wanted={active.wanted}
                    wantCount={active.wantCount}
                    onToggleWant={active.onToggleWant}
                />
            </div>
        </article>
    )
}
