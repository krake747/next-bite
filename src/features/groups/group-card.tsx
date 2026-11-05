import { type AvatarMember } from "@features/social/avatar-group"
import { Card } from "@ui/card"

import { GroupHeader } from "./group-header"
import { SharedRestaurantList, type SharedRestaurant } from "./shared-restaurant-list"

export function GroupCard({
    name,
    description,
    coverUrl,
    members,
    restaurants,
    onSelectRestaurant,
}: Readonly<{
    name: string
    description?: string | undefined
    coverUrl?: string | undefined
    members: ReadonlyArray<AvatarMember>
    restaurants: ReadonlyArray<SharedRestaurant>
    onSelectRestaurant?: ((id: string) => void) | undefined
}>) {
    return (
        <Card>
            <GroupHeader
                name={name}
                description={description}
                coverUrl={coverUrl}
                members={members}
                restaurantCount={restaurants.length}
            />
            <div className="pt-3">
                <SharedRestaurantList items={restaurants} onSelect={onSelectRestaurant} />
            </div>
        </Card>
    )
}
