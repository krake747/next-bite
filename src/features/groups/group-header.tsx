import { type AvatarMember } from "@features/social/avatar-group"
import { LazyImage } from "@pattern/lazy-image"

import { GroupMembers } from "./group-members"

export function GroupHeader({
    name,
    description,
    coverUrl,
    members,
    restaurantCount,
}: Readonly<{
    name: string
    description?: string | undefined
    coverUrl?: string | undefined
    members: ReadonlyArray<AvatarMember>
    restaurantCount: number
}>) {
    const showCover = coverUrl !== undefined && coverUrl !== ""
    return (
        <div>
            {showCover && (
                <div className="overflow-hidden rounded-t-card">
                    <LazyImage src={coverUrl} alt={`${name} - group cover`} aspectRatio="16/9" />
                </div>
            )}
            <div className="space-y-2 p-4 pb-0">
                <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-[22px] leading-7 font-semibold tracking-tight text-stone-900">
                        {name}
                    </h3>
                    <p className="shrink-0 text-xs font-medium text-stone-500">
                        {restaurantCount === 1 ? "1 spot" : `${restaurantCount} spots`}
                    </p>
                </div>
                {description !== undefined && description !== "" && (
                    <p className="text-sm text-stone-600">{description}</p>
                )}
                <GroupMembers members={members} />
            </div>
        </div>
    )
}
