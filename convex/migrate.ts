import { internalMutation } from "./_generated/server"
import { formatDisplayName } from "./helpers"

export const cleanupOrphanedStorage = internalMutation(async (ctx) => {
    const restaurants = await ctx.db.query("restaurants").collect()

    const referencedStorageIds = new Set<string>()
    for (const restaurant of restaurants) {
        for (const img of restaurant.images) {
            if (img.storageId !== "") {
                referencedStorageIds.add(img.storageId)
            }
        }
    }

    return { referenced: Array.from(referencedStorageIds) }
})

type LegacyRestaurantDoc = {
    readonly name?: unknown
    readonly cuisine?: unknown
    readonly location?: unknown
    readonly lat?: unknown
    readonly lng?: unknown
    readonly placeId?: unknown
    readonly openingHours?: unknown
    readonly notes?: unknown
    readonly link?: unknown
    readonly rating?: unknown
    readonly images?: unknown
    readonly addedBy?: unknown
    readonly address?: unknown
    readonly ownerId?: unknown
    readonly visibility?: unknown
    readonly createdAt?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
}

function asNonEmptyString(value: unknown): string | undefined {
    return typeof value === "string" && value !== "" ? value : undefined
}

function normalizeImages(value: unknown): { url: string; storageId: string }[] {
    if (!Array.isArray(value)) {
        return []
    }
    const images: { url: string; storageId: string }[] = []
    for (const item of value) {
        if (typeof item === "string" && item !== "") {
            images.push({ url: item, storageId: "" })
        } else if (isRecord(item) && typeof item.url === "string" && typeof item.storageId === "string") {
            images.push({ url: item.url, storageId: item.storageId })
        }
    }
    return images
}

function normalizeOpeningHours(value: unknown):
    | {
          openState: "open" | "closed" | "unknown"
          periods: { day: number; openTime: string; closeTime: string }[]
          weekdayText: string[]
      }
    | undefined {
    if (!isRecord(value)) {
        return undefined
    }
    let openState: "open" | "closed" | "unknown" = "unknown"
    if (value.openNow === true) {
        openState = "open"
    } else if (value.openNow === false) {
        openState = "closed"
    }
    const periods: { day: number; openTime: string; closeTime: string }[] = []
    if (Array.isArray(value.periods)) {
        for (const period of value.periods) {
            if (
                isRecord(period) &&
                typeof period.day === "number" &&
                typeof period.openTime === "string" &&
                typeof period.closeTime === "string"
            ) {
                periods.push({ day: period.day, openTime: period.openTime, closeTime: period.closeTime })
            }
        }
    }
    const weekdayText = Array.isArray(value.weekdayText)
        ? value.weekdayText.filter((text): text is string => typeof text === "string")
        : []
    return { openState, periods, weekdayText }
}

function isMigratedShape(doc: LegacyRestaurantDoc): boolean {
    return (
        isRecord(doc.address) &&
        typeof doc.address.label === "string" &&
        typeof doc.ownerId === "string" &&
        typeof doc.visibility === "string" &&
        typeof doc.createdAt === "number"
    )
}

export const backfillLegacyRestaurants = internalMutation({
    args: {},
    handler: async (ctx) => {
        const docs = await ctx.db.query("restaurants").collect()
        const profiles = await ctx.db.query("profiles").collect()
        const migrated: string[] = []
        const needsOwner: string[] = []

        for (const doc of docs) {
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- legacy docs predate the schema by definition
            const legacy = doc as unknown as LegacyRestaurantDoc
            if (isMigratedShape(legacy)) {
                continue
            }

            const label = asNonEmptyString(legacy.location) ?? "Unknown location"
            const lat = typeof legacy.lat === "number" ? legacy.lat : undefined
            const lng = typeof legacy.lng === "number" ? legacy.lng : undefined
            const placeId = asNonEmptyString(legacy.placeId)
            const openingHours = normalizeOpeningHours(legacy.openingHours)
            const enrichment =
                placeId !== undefined || (lat !== undefined && lng !== undefined) || openingHours !== undefined
                    ? {
                          ...(placeId !== undefined ? { placeId } : {}),
                          ...(lat !== undefined && lng !== undefined ? { coords: { lat, lng } } : {}),
                          ...(openingHours !== undefined ? { openingHours } : {}),
                      }
                    : undefined

            const addedBy = asNonEmptyString(legacy.addedBy)
            const profile =
                addedBy !== undefined
                    ? profiles.find((candidate) => candidate.name.trim().toLowerCase() === addedBy.toLowerCase())
                    : undefined
            const owner =
                profile ?? (profiles.length === 1 && profiles[0] !== undefined ? profiles[0] : undefined)
            const ownerId = owner?.authUserId ?? ""
            if (ownerId === "") {
                needsOwner.push(doc._id)
            }

            const notes = asNonEmptyString(legacy.notes)
            const link = asNonEmptyString(legacy.link)
            const rating = typeof legacy.rating === "number" ? legacy.rating : undefined

            await ctx.db.replace(doc._id, {
                ownerId,
                ownerName: formatDisplayName(addedBy),
                name: asNonEmptyString(legacy.name) ?? "Untitled",
                cuisine: asNonEmptyString(legacy.cuisine) ?? "Unknown",
                address: {
                    label,
                    ...(enrichment !== undefined ? { enrichment } : {}),
                },
                ...(notes !== undefined || link !== undefined
                    ? {
                          details: {
                              ...(notes !== undefined ? { notes } : {}),
                              ...(link !== undefined ? { link } : {}),
                          },
                      }
                    : {}),
                ...(rating !== undefined ? { rating } : {}),
                images: normalizeImages(legacy.images),
                visibility: "private",
                createdAt: Date.now(),
            })
            migrated.push(doc._id)
        }

        return { total: docs.length, migrated, needsOwner }
    },
})
