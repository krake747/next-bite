import { Badge } from "@ui/badge"
import { cx } from "@ui/cva.config"

import { formatBusinessStatus, formatOpenState, formatPriceLevel } from "./place-details-utils"
import { type RestaurantSignals } from "./use-restaurant-signals"

export function RestaurantPriceBadge({ signals }: Readonly<{ signals: RestaurantSignals }>) {
    if (signals.status !== "ready") {
        return null
    }
    const price = formatPriceLevel(signals.priceLevel)
    if (price === undefined) {
        return null
    }
    return <Badge tone="neutral">{price}</Badge>
}

export function RestaurantStatusLine({ signals }: Readonly<{ signals: RestaurantSignals }>) {
    if (signals.status !== "ready") {
        return null
    }
    const closedLabel = formatBusinessStatus(signals.businessStatus)
    if (closedLabel !== undefined) {
        return (
            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <span className="size-1.5 rounded-full bg-tomato-500" aria-hidden="true" />
                {closedLabel}
            </p>
        )
    }
    const openLabel = formatOpenState(signals.openState)
    if (openLabel === undefined) {
        return null
    }
    return (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span
                className={cx("size-1.5 rounded-full", signals.openState === "open" ? "bg-success" : "bg-tomato-500")}
                aria-hidden="true"
            />
            {openLabel}
        </p>
    )
}
