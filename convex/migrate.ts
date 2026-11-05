import { type Doc } from "./_generated/dataModel"
import { internalMutation, type MutationCtx } from "./_generated/server"
import { formatDisplayName } from "./helpers"

export const cleanupOrphanedStorage = internalMutation(async (ctx) => {
    const restaurants = await ctx.db.query("restaurants").collect()

    const referencedStorageIds = new Set<string>()
    for (const restaurant of restaurants) {
        for (const img of restaurant.images ?? []) {
            if (typeof img === "string" || img.storageId === "") {
                continue
            }
            referencedStorageIds.add(img.storageId)
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
    readonly details?: unknown
    readonly ownerId?: unknown
    readonly ownerName?: unknown
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

type OpeningHoursShape = {
    openState: "open" | "closed" | "unknown"
    periods: { day: number; openTime: string; closeTime: string }[]
    weekdayText: string[]
}

type EnrichmentShape = {
    placeId?: string
    coords?: { lat: number; lng: number }
    openingHours?: OpeningHoursShape
}

function normalizeOpeningHours(value: unknown): OpeningHoursShape | undefined {
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

const LEGACY_KEYS = ["addedBy", "location", "lat", "lng", "placeId", "link", "notes", "openingHours"] as const

function hasLegacyExtras(legacy: LegacyRestaurantDoc): boolean {
    return LEGACY_KEYS.some((key) => legacy[key] !== undefined)
}

function isValidPeriod(value: unknown): value is { day: number; openTime: string; closeTime: string } {
    return (
        isRecord(value) &&
        typeof value.day === "number" &&
        typeof value.openTime === "string" &&
        typeof value.closeTime === "string"
    )
}

function resolveOpeningHours(legacy: LegacyRestaurantDoc, existing: unknown): OpeningHoursShape | undefined {
    if (isRecord(existing)) {
        const openState = existing.openState
        if (openState === "open" || openState === "closed" || openState === "unknown") {
            const periods = Array.isArray(existing.periods) ? existing.periods.filter(isValidPeriod) : []
            const weekdayText = Array.isArray(existing.weekdayText)
                ? existing.weekdayText.filter((text): text is string => typeof text === "string")
                : []
            return { openState, periods, weekdayText }
        }
    }
    return normalizeOpeningHours(legacy.openingHours)
}

function resolveCoords(legacy: LegacyRestaurantDoc, existing: unknown): { lat: number; lng: number } | undefined {
    const existingCoords = isRecord(existing) ? existing.coords : undefined
    const lat =
        (isRecord(existingCoords) && typeof existingCoords.lat === "number" ? existingCoords.lat : undefined) ??
        (typeof legacy.lat === "number" ? legacy.lat : undefined)
    const lng =
        (isRecord(existingCoords) && typeof existingCoords.lng === "number" ? existingCoords.lng : undefined) ??
        (typeof legacy.lng === "number" ? legacy.lng : undefined)
    if (lat === undefined || lng === undefined) {
        return undefined
    }
    return { lat, lng }
}

function resolveEnrichment(legacy: LegacyRestaurantDoc): EnrichmentShape | undefined {
    const existing = isRecord(legacy.address) ? legacy.address.enrichment : undefined
    const placeId =
        (isRecord(existing) ? asNonEmptyString(existing.placeId) : undefined) ?? asNonEmptyString(legacy.placeId)
    const coords = resolveCoords(legacy, existing)
    const openingHours = resolveOpeningHours(legacy, existing)
    if (placeId === undefined && coords === undefined && openingHours === undefined) {
        return undefined
    }
    return {
        ...(placeId !== undefined ? { placeId } : {}),
        ...(coords !== undefined ? { coords } : {}),
        ...(openingHours !== undefined ? { openingHours } : {}),
    }
}

function resolveDetails(legacy: LegacyRestaurantDoc): { notes?: string; link?: string } | undefined {
    const existing = isRecord(legacy.details) ? legacy.details : undefined
    const notes = (isRecord(existing) ? asNonEmptyString(existing.notes) : undefined) ?? asNonEmptyString(legacy.notes)
    const link = (isRecord(existing) ? asNonEmptyString(existing.link) : undefined) ?? asNonEmptyString(legacy.link)
    if (notes === undefined && link === undefined) {
        return undefined
    }
    return {
        ...(notes !== undefined ? { notes } : {}),
        ...(link !== undefined ? { link } : {}),
    }
}

function resolveOwnerId(
    profiles: ReadonlyArray<Doc<"profiles">>,
    addedBy: string | undefined,
    existingOwnerId: unknown,
): string {
    if (typeof existingOwnerId === "string" && existingOwnerId !== "") {
        return existingOwnerId
    }
    const profile =
        addedBy !== undefined
            ? profiles.find((candidate) => candidate.name.trim().toLowerCase() === addedBy.toLowerCase())
            : undefined
    const owner = profile ?? (profiles.length === 1 && profiles[0] !== undefined ? profiles[0] : undefined)
    return owner?.authUserId ?? ""
}

async function migrateLegacyDoc(
    ctx: MutationCtx,
    doc: Doc<"restaurants">,
    profiles: ReadonlyArray<Doc<"profiles">>,
): Promise<{ migrated: boolean; ownerId: string }> {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- legacy docs predate the schema by definition
    const legacy = doc as unknown as LegacyRestaurantDoc
    if (isMigratedShape(legacy) && !hasLegacyExtras(legacy)) {
        return { migrated: false, ownerId: "" }
    }

    const label =
        (isRecord(legacy.address) ? asNonEmptyString(legacy.address.label) : undefined) ??
        asNonEmptyString(legacy.location) ??
        "Unknown location"
    const enrichment = resolveEnrichment(legacy)

    const addedBy = asNonEmptyString(legacy.addedBy)
    const ownerId = resolveOwnerId(profiles, addedBy, legacy.ownerId)

    const details = resolveDetails(legacy)
    const rating = typeof legacy.rating === "number" ? legacy.rating : undefined
    const createdAt = typeof legacy.createdAt === "number" ? legacy.createdAt : Date.now()

    await ctx.db.replace(doc._id, {
        ownerId,
        ownerName: asNonEmptyString(legacy.ownerName) ?? formatDisplayName(addedBy),
        name: asNonEmptyString(legacy.name) ?? "Untitled",
        cuisine: asNonEmptyString(legacy.cuisine) ?? "Unknown",
        address: {
            label,
            ...(enrichment !== undefined ? { enrichment } : {}),
        },
        ...(details !== undefined ? { details } : {}),
        ...(rating !== undefined ? { rating } : {}),
        images: normalizeImages(legacy.images),
        visibility: legacy.visibility === "shared" ? "shared" : "private",
        createdAt,
    })
    return { migrated: true, ownerId }
}

export const backfillLegacyRestaurants = internalMutation({
    args: {},
    handler: async (ctx) => {
        const docs = await ctx.db.query("restaurants").collect()
        const profiles = await ctx.db.query("profiles").collect()
        const migrated: string[] = []
        const needsOwner: string[] = []

        for (const doc of docs) {
            const result = await migrateLegacyDoc(ctx, doc, profiles)
            if (result.migrated) {
                migrated.push(doc._id)
                if (result.ownerId === "") {
                    needsOwner.push(doc._id)
                }
            }
        }

        return { total: docs.length, migrated, needsOwner }
    },
})
