import { type Restaurant } from "@core/restaurants"
import { friendUpdateTextFor } from "@core/saves"
import { AvatarGroup } from "@pattern/avatar-group"
import { photoUrls } from "@pattern/gallery"
import { LazyImage } from "@pattern/lazy-image"
import { SocialMetadata } from "@pattern/social-metadata"

import { WantBar, type WantState } from "./want-bar"

type FriendUpdateAuthor = {
    readonly name: string
    readonly src?: string | undefined
}

export function FriendUpdate({ restaurant, want }: Readonly<{ restaurant: Restaurant; want?: WantState | undefined }>) {
    return (
        <article className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <FriendUpdateAuthorHeader
                author={{ name: restaurant.ownerName }}
                time={new Date(restaurant._creationTime).toLocaleDateString()}
            />
            <div className="space-y-3 p-4">
                <p className="text-body text-foreground">{friendUpdateTextFor(restaurant.name, restaurant.note)}</p>
                <FriendUpdateRestaurant
                    name={restaurant.name}
                    cuisine={restaurant.cuisine}
                    imageUrls={photoUrls(restaurant.photos)}
                />
                <SocialMetadata ownerName={restaurant.ownerName} wantCount={restaurant.wantCount} />
                {want !== undefined && <WantBar want={want} />}
            </div>
        </article>
    )
}

function FriendUpdateAuthorHeader({ author, time }: Readonly<{ author: FriendUpdateAuthor; time: string }>) {
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

function FriendUpdateRestaurant({
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
