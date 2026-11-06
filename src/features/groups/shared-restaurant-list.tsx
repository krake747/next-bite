import { Badge } from "@ui/badge"

export type SharedRestaurant = {
    readonly id: string
    readonly name: string
    readonly cuisine: string
    readonly ownerName?: string | undefined
}

export function SharedRestaurantList({
    items,
}: Readonly<{
    items: ReadonlyArray<SharedRestaurant>
}>) {
    if (items.length === 0) {
        return (
            <p className="px-4 py-3 text-sm text-stone-600">No restaurants yet. Share somewhere you'd love to try.</p>
        )
    }
    return (
        <ul className="divide-y divide-stone-100">
            {items.map((item) => (
                <li key={item.id}>
                    <div className="flex items-center gap-2.5 px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-stone-900" title={item.name}>
                                {item.name}
                            </p>
                            {item.ownerName !== undefined && item.ownerName !== "" && (
                                <p className="truncate text-xs text-stone-600" title={`Added by ${item.ownerName}`}>
                                    Added by {item.ownerName}
                                </p>
                            )}
                        </div>
                        <Badge variant="neutral">{item.cuisine}</Badge>
                    </div>
                </li>
            ))}
        </ul>
    )
}
