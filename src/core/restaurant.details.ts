export type Coords = {
    readonly lat: number
    readonly lng: number
}

export type DetailsFields = {
    readonly notes?: string | undefined
    readonly link?: string | undefined
}

export type DetailsDoc =
    | {
          readonly notes?: string
          readonly link?: string
      }
    | undefined

export type Enrichment<Hours> =
    | {
          readonly placeId?: string
          readonly coords?: Coords
          readonly openingHours?: Hours
      }
    | undefined

function nonEmptyText(value: string | undefined): string | undefined {
    return value !== undefined && value !== "" ? value : undefined
}

export function cleanDetails(input: DetailsFields): DetailsDoc {
    const notes = nonEmptyText(input.notes)
    const link = nonEmptyText(input.link)
    if (notes === undefined && link === undefined) {
        return undefined
    }
    return { ...(notes !== undefined ? { notes } : {}), ...(link !== undefined ? { link } : {}) }
}

export function mergeDetails(existing: DetailsDoc, input: DetailsFields): DetailsDoc {
    if (input.notes === undefined && input.link === undefined) {
        return existing
    }
    return cleanDetails({
        notes: input.notes ?? existing?.notes,
        link: input.link ?? existing?.link,
    })
}

export function mergeEnrichment<Hours>(
    existing: Enrichment<Hours> | undefined,
    coords: Coords | undefined,
): Enrichment<Hours> | undefined {
    if (coords === undefined) {
        return existing
    }
    return {
        ...(existing?.placeId !== undefined ? { placeId: existing.placeId } : {}),
        coords: { lat: coords.lat, lng: coords.lng },
        ...(existing?.openingHours !== undefined ? { openingHours: existing.openingHours } : {}),
    }
}
