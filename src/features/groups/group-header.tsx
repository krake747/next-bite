import { type AvatarMember } from "@pattern/avatar-group"

import { GroupMembers } from "./group-members"

export function GroupHeader({
    name,
    description,
    members,
    restaurantCount,
}: Readonly<{
    name: string
    description?: string | undefined
    members: ReadonlyArray<AvatarMember>
    restaurantCount: number
}>) {
    return (
        <div>
            <div className="space-y-2 p-4 pb-0">
                <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-xl leading-7 font-semibold tracking-tight text-balance text-foreground">
                        {name}
                    </h3>
                    <p className="shrink-0 text-xs font-medium text-muted-foreground">
                        {restaurantCount === 1 ? "1 spot" : `${restaurantCount} spots`}
                    </p>
                </div>
                {description !== undefined && description !== "" && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
                <GroupMembers members={members} />
            </div>
        </div>
    )
}
