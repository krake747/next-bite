import { AvatarGroup, type AvatarMember } from "@pattern/avatar-group"
import { photoUrls } from "@pattern/gallery/photos"
import { LazyImage } from "@pattern/lazy-image"

import { ReactionBar, type Reactions } from "./reaction-bar"
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

const idleReactions: Reactions = {
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
    restaurant,
    social,
    reactions,
}: Readonly<{
    author: ActivityAuthor
    time: string
    text: string
    restaurant: Readonly<{
        name: string
        cuisine?: string | undefined
        images?: ReadonlyArray<Readonly<{ url: string }>> | undefined
    }>
    social?:
        | Readonly<{
              ownerName?: string | undefined
              wantCount?: number | undefined
              beenCount?: number | undefined
              interestedNames?: ReadonlyArray<string> | undefined
          }>
        | undefined
    reactions?: Reactions | undefined
}>) {
    const active = reactions ?? idleReactions
    const friends: ReadonlyArray<AvatarMember> = (social?.interestedNames ?? []).map((name) => ({ name }))
    return (
        <article className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <ActivityAuthorHeader author={author} time={time} />
            <div className="space-y-3 p-4">
                <p className="text-body text-stone-800">{text}</p>
                <ActivityRestaurant
                    name={restaurant.name}
                    cuisine={restaurant.cuisine}
                    photoUrls={photoUrls(restaurant.images ?? [])}
                />
                <SocialMetadata
                    ownerName={social?.ownerName}
                    wantCount={social?.wantCount}
                    beenCount={social?.beenCount}
                />
                {friends.length > 0 && <AvatarGroup members={friends} />}
                <ReactionBar reactions={active} />
            </div>
        </article>
    )
}
