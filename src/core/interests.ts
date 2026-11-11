import { useConvexMutation, useConvexQuery } from "@api/convex.context"
import { type Id } from "@api/data.model"
import { api } from "@api/endpoints"

import { countReactions } from "./interests.counts"
import { useSessionStatus } from "./session"
import { isTempId } from "./temp.ids"
import { type Viewer } from "./viewer"

export type InterestInput = {
    readonly restaurantId: string
    readonly userId: string
    readonly displayName: string
    readonly status: "want" | "been"
}

export type SocialSnapshot = {
    readonly interests: ReadonlyArray<InterestInput>
}

export type RestaurantSocial = {
    readonly wantCount: number
    readonly beenCount: number
    readonly wanted: boolean
    readonly interestedNames: ReadonlyArray<string>
}

export const emptySocial: RestaurantSocial = {
    wantCount: 0,
    beenCount: 0,
    wanted: false,
    interestedNames: [],
}

export function summarizeSocial(restaurantId: string, snapshot: SocialSnapshot, viewer: Viewer): RestaurantSocial {
    const interests = snapshot.interests.filter((interest) => interest.restaurantId === restaurantId)
    return countReactions(interests, viewer)
}

export function orderFeedByRecency<Restaurant extends { readonly _creationTime: number }>(
    restaurants: ReadonlyArray<Restaurant>,
): Restaurant[] {
    return [...restaurants].toSorted((a, b) => b._creationTime - a._creationTime)
}

export function feedTextFor(name: string, notes: string | undefined): string {
    const trimmed = notes?.trim() ?? ""
    return trimmed === "" ? `Added ${name}.` : trimmed
}

export function withoutTempIds(ids: ReadonlyArray<Id<"restaurants">>): Id<"restaurants">[] {
    return ids.filter((id) => !isTempId(String(id)))
}

export function useSocialSummaries(
    restaurantIds: ReadonlyArray<Id<"restaurants">>,
): ReadonlyMap<string, RestaurantSocial> | undefined {
    const status = useSessionStatus()
    const stableIds = withoutTempIds(restaurantIds)
    const summaries = useConvexQuery(
        api.interests.getSummaries,
        { restaurantIds: [...stableIds] },
        { skip: status.kind !== "ready" },
    )
    if (summaries === undefined) {
        return undefined
    }
    return new Map(summaries.flatMap((summary) => (summary === null ? [] : [[summary.restaurantId, summary] as const])))
}

export function useSocialForRestaurant(restaurantId: Id<"restaurants">, viewer: Viewer): RestaurantSocial | undefined {
    const status = useSessionStatus()
    const snapshot = useConvexQuery(api.interests.getForRestaurant, { restaurantId }, { skip: status.kind !== "ready" })
    if (snapshot === undefined || snapshot === null) {
        return undefined
    }
    return summarizeSocial(restaurantId, snapshot, viewer)
}

export const useToggleInterest = () => useConvexMutation(api.interests.toggleInterest)
