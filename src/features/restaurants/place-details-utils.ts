export type EnterpriseDetails = {
    readonly openingHours?: {
        readonly openState: "open" | "closed" | "unknown"
        readonly periods: ReadonlyArray<{
            readonly day: number
            readonly openTime: string
            readonly closeTime: string
        }>
        readonly weekdayText: ReadonlyArray<string>
    }
    readonly rating?: number | undefined
    readonly ratingCount?: number | undefined
    readonly priceLevel?: string | undefined
    readonly websiteUri?: string | undefined
}

const PRICE_LABELS: Record<string, string | undefined> = {
    PRICE_LEVEL_FREE: "Free",
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
}

export function formatPriceLevel(priceLevel: string | undefined): string | undefined {
    if (priceLevel === undefined) {
        return undefined
    }
    return PRICE_LABELS[priceLevel]
}

export function formatRating(rating: number | undefined): string | undefined {
    if (rating === undefined) {
        return undefined
    }
    return rating.toFixed(1)
}

export function formatRatingCount(count: number | undefined): string | undefined {
    if (count === undefined) {
        return undefined
    }
    return `(${count})`
}

const BUSINESS_STATUS_LABELS: Record<string, string | undefined> = {
    CLOSED_TEMPORARILY: "Temporarily closed",
    CLOSED_PERMANENTLY: "Permanently closed",
}

export function formatBusinessStatus(status: string | undefined): string | undefined {
    if (status === undefined) {
        return undefined
    }
    return BUSINESS_STATUS_LABELS[status]
}

const OPEN_STATE_LABELS: Record<"open" | "closed" | "unknown", string | undefined> = {
    open: "Open now",
    closed: "Closed",
    unknown: undefined,
}

export function formatOpenState(openState: "open" | "closed" | "unknown"): string | undefined {
    return OPEN_STATE_LABELS[openState]
}

export function hasEnterpriseContent(details: EnterpriseDetails | undefined): boolean {
    if (details === undefined) {
        return false
    }
    return (
        details.rating !== undefined ||
        details.ratingCount !== undefined ||
        details.priceLevel !== undefined ||
        (details.websiteUri !== undefined && details.websiteUri !== "")
    )
}
