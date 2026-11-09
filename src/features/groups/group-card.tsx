import { type AvatarMember } from "@pattern/avatar-group"
import { Card } from "@ui/card"

import { GroupHeader } from "./group-header"
import { SharedRestaurantList, type SharedRestaurant } from "./shared-restaurant-list"

export function GroupCard({
    name,
    description,
    members,
    restaurants,
}: Readonly<{
    name: string
    description?: string | undefined
    members: ReadonlyArray<AvatarMember>
    restaurants: ReadonlyArray<SharedRestaurant>
}>) {
    return (
        <Card>
            <GroupHeader name={name} description={description} members={members} restaurantCount={restaurants.length} />
            <div className="pt-3">
                <SharedRestaurantList items={restaurants} />
            </div>
        </Card>
    )
}
