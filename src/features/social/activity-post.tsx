import { AvatarGroup } from "@pattern/avatar-group"
import { photoUrls } from "@pattern/gallery"
import { LazyImage } from "@pattern/lazy-image"
import { SocialMetadata } from "@pattern/social-metadata"

import { ReactionBar, type Reactions } from "./reaction-bar"

export type ActivityAuthor = {
    readonly name: string
    readonly src?: string | undefined
}

export function ActivityPost({
    author,
    time,
    text,
    restaurant,
    ownerName,
    wantCount,
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
    ownerName?: string | undefined
    wantCount?: number | string | undefined
    reactions?: Reactions | undefined
}>) {
    return (
        <article className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <ActivityAuthorHeader author={author} time={time} />
            <div className="space-y-3 p-4">
                <p className="text-body text-foreground">{text}</p>
                <ActivityRestaurant
                    name={restaurant.name}
                    cuisine={restaurant.cuisine}
                    imageUrls={photoUrls(restaurant.images ?? [])}
                />
                <SocialMetadata ownerName={ownerName} wantCount={wantCount} />
                {reactions !== undefined && <ReactionBar reactions={reactions} />}
            </div>
        </article>
    )
}

function ActivityAuthorHeader({ author, time }: Readonly<{ author: ActivityAuthor; time: string }>) {
    return (
        <div className="flex items-center gap-3 p-4 pb-0">
            <AvatarGroup members={[{ name: author.name, src: author.src }]} max={1} />
            <div>
                <p className="text-sm font-semibold text-foreground">{author.name}</p>
                <p className="text-xs text-muted-foreground">{time}</p>
            </div>
        </div>
    )
}

function ActivityRestaurant({
    name,
    cuisine,
    imageUrls,
}: Readonly<{
    name: string
    cuisine?: string | undefined
    imageUrls?: ReadonlyArray<string> | undefined
}>) {
    const cover = imageUrls?.[0]
    const showCover = cover !== undefined && cover !== ""
    return (
        <div className="space-y-2">
            {showCover && <LazyImage src={cover} alt={name} ratio={16 / 9} className="rounded-lg" />}
            <div>
                <p className="font-display text-lg font-semibold text-balance text-foreground">{name}</p>
                {cuisine !== undefined && cuisine !== "" && <p className="text-sm text-muted-foreground">{cuisine}</p>}
            </div>
        </div>
    )
}
