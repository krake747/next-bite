import { GroupCard } from "@features/groups/group-card"
import { SharedRestaurantList } from "@features/groups/shared-restaurant-list"
import { RestaurantHeader } from "@features/restaurants/restaurant-header"
import { RestaurantInterestButton } from "@features/restaurants/restaurant-interest-button"
import { Card } from "@ui/card"

export const restaurantMeta = {
    id: "restaurant",
    group: "Compositions",
    title: "Restaurant and group compositions",
    body: "Domain compositions built from the same primitives. Interest is always labeled, never colour alone.",
} as const

const noop = () => {}

export function RestaurantDemo() {
    return (
        <Card>
            <div className="w-full max-w-xl space-y-4 p-5">
                <Card>
                    <RestaurantHeader
                        name="Trattoria Verde"
                        link="https://example.com/menu"
                        ownerName="Alex"
                        wantCount={4}
                        location="Luxembourg City"
                        hasLocation={false}
                    />
                    <div className="px-5 pb-4 md:px-4">
                        <RestaurantInterestButton wanted={false} wantCount={4} onToggleWant={noop} />
                    </div>
                </Card>
                <GroupCard
                    name="Food Group"
                    description="Weekend brunch plans"
                    members={[{ name: "Alex" }, { name: "Priya" }, { name: "Jamie" }]}
                    restaurants={[
                        { id: "r1", name: "Trattoria Verde", cuisine: "Italian", ownerName: "Alex" },
                        { id: "r2", name: "Sushi Bar", cuisine: "Japanese", ownerName: "Priya" },
                    ]}
                />
                <div className="w-full">
                    <SharedRestaurantList items={[{ id: "r1", name: "Trattoria Verde", cuisine: "Italian" }]} />
                </div>
            </div>
        </Card>
    )
}
