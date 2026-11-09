import {
    ArrowCounterClockwiseIcon,
    MagnifyingGlassIcon,
    PencilLineIcon,
    ShareNetworkIcon,
    TrashIcon,
} from "@phosphor-icons/react"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { useLookupPlaceIdAndHours, useRefreshOpeningHours, type Restaurant } from "@core/restaurants"
import { useAuth } from "@core/session"
import { IconButton } from "@ui/icon-button"

export function RestaurantCardActions({
    restaurantId,
    detailsHref,
    hasPlaceId,
    onDeleteRequest,
    onShareRequest,
}: Readonly<{
    restaurantId: Restaurant["_id"]
    detailsHref?: string | undefined
    hasPlaceId: boolean
    onDeleteRequest: () => void
    onShareRequest: () => void
}>) {
    const auth = useAuth()
    const navigate = useNavigate()
    const refreshOpeningHours = useRefreshOpeningHours()
    const lookupPlaceIdAndHours = useLookupPlaceIdAndHours()
    const [isRefreshing, setIsRefreshing] = useState(false)

    const runLookup = (lookup: {
        mutate: (args: { restaurantId: Restaurant["_id"] }, opts: { onSettled: () => void }) => void
    }) => {
        setIsRefreshing(true)
        lookup.mutate(
            { restaurantId },
            {
                onSettled: () => {
                    setIsRefreshing(false)
                },
            },
        )
    }

    return auth.isAuthenticated ? (
        <>
            {hasPlaceId ? (
                <IconButton
                    label="Refresh hours"
                    size="sm"
                    disabled={isRefreshing}
                    onClick={() => {
                        runLookup(refreshOpeningHours)
                    }}
                >
                    <ArrowCounterClockwiseIcon className="size-3.5" />
                </IconButton>
            ) : (
                <IconButton
                    label="Find hours"
                    size="sm"
                    disabled={isRefreshing}
                    onClick={() => {
                        runLookup(lookupPlaceIdAndHours)
                    }}
                >
                    <MagnifyingGlassIcon className="size-3.5" />
                </IconButton>
            )}
            <IconButton
                label="Edit restaurant"
                size="sm"
                onClick={() => {
                    void navigate({
                        to: detailsHref ?? `/restaurants/${restaurantId}`,
                    })
                }}
            >
                <PencilLineIcon className="size-3.5" />
            </IconButton>
            <IconButton label="Share poster" size="sm" onClick={onShareRequest}>
                <ShareNetworkIcon className="size-3.5" />
            </IconButton>
            <IconButton label="Delete restaurant" size="sm" tone="destructive" onClick={onDeleteRequest}>
                <TrashIcon className="size-3.5" />
            </IconButton>
        </>
    ) : undefined
}
