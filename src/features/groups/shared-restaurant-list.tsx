import ChevronRight from "lucide-react/icons/chevron-right"

import { Badge } from "@ui/badge"

export type SharedRestaurant = {
    readonly id: string
    readonly name: string
    readonly cuisine: string
    readonly addedBy?: string | undefined
}

export function SharedRestaurantList({
    items,
    onSelect,
}: Readonly<{
    items: ReadonlyArray<SharedRestaurant>
    onSelect?: ((id: string) => void) | undefined
}>) {
    if (items.length === 0) {
        return <p className="px-4 py-3 text-sm text-stone-500">No spots yet. Share somewhere you'd love to try.</p>
    }
    return (
        <ul className="divide-y divide-stone-100">
            {items.map((item) => {
                const row = (
                    <>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-stone-900">{item.name}</p>
                            {item.addedBy !== undefined && item.addedBy !== "" && (
                                <p className="truncate text-xs text-stone-500">Added by {item.addedBy}</p>
                            )}
                        </div>
                        <Badge variant="neutral">{item.cuisine}</Badge>
                        {onSelect !== undefined && (
                            <ChevronRight className="size-4 shrink-0 text-stone-400" aria-hidden="true" />
                        )}
                    </>
                )
                return (
                    <li key={item.id}>
                        {onSelect === undefined ? (
                            <div className="flex items-center gap-2.5 px-4 py-2.5">{row}</div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    onSelect(item.id)
                                }}
                                className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-stone-50"
                            >
                                {row}
                            </button>
                        )}
                    </li>
                )
            })}
        </ul>
    )
}
