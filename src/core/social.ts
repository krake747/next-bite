import { useConvexMutation, useConvexQuery } from "@api/convex.context"
import { type Id } from "@api/data.model"
import { api } from "@api/endpoints"

import { useSessionStatus } from "./session"
import { countReactions, type Viewer } from "./social.counts"
import { isTempId } from "./temp.ids"

export type InterestInput = {
    readonly restaurantId: string
    readonly userId: string
    readonly displayName: string
    readonly status: "want" | "been"
}

export type LikeInput = {
    readonly restaurantId: string
    readonly userId: string
    readonly displayName: string
}

export type CommentInput = {
    readonly _id: string
    readonly restaurantId: string
    readonly userId: string
    readonly displayName: string
    readonly text: string
    readonly createdAt: number
}

export type SocialSnapshot = {
    readonly interests: ReadonlyArray<InterestInput>
    readonly likes: ReadonlyArray<LikeInput>
    readonly comments: ReadonlyArray<CommentInput>
}

export type RestaurantSocial = {
    readonly wantCount: number
    readonly beenCount: number
    readonly wanted: boolean
    readonly likeCount: number
    readonly liked: boolean
    readonly comments: ReadonlyArray<CommentInput>
    readonly interestedNames: ReadonlyArray<string>
}

export type RestaurantSocialSummary = {
    readonly wantCount: number
    readonly beenCount: number
    readonly wanted: boolean
    readonly likeCount: number
    readonly liked: boolean
    readonly commentCount: number
    readonly interestedNames: ReadonlyArray<string>
}

const baseCounts = {
    wantCount: 0,
    beenCount: 0,
    wanted: false,
    likeCount: 0,
    liked: false,
    interestedNames: [],
} as const

export const emptySocialSummary: RestaurantSocialSummary = {
    ...baseCounts,
    interestedNames: [...baseCounts.interestedNames],
    commentCount: 0,
}

export const emptySocial: RestaurantSocial = {
    ...baseCounts,
    interestedNames: [...baseCounts.interestedNames],
    comments: [],
}

export function summarizeSocial(restaurantId: string, snapshot: SocialSnapshot, viewer: Viewer): RestaurantSocial {
    const interests = snapshot.interests.filter((interest) => interest.restaurantId === restaurantId)
    const likes = snapshot.likes.filter((like) => like.restaurantId === restaurantId)
    const comments = snapshot.comments
        .filter((comment) => comment.restaurantId === restaurantId)
        .toSorted((a, b) => a.createdAt - b.createdAt)
    return {
        ...countReactions(interests, likes, viewer),
        comments,
    }
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
): ReadonlyMap<string, RestaurantSocialSummary> | undefined {
    const status = useSessionStatus()
    // Optimistic temp ids are not real Convex ids and the backend validator rejects them, so
    // they never travel. The subscription re-fires with the synced ids once resolved.
    const stableIds = withoutTempIds(restaurantIds)
    const summaries = useConvexQuery(
        api.social.getSummaries,
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
    const snapshot = useConvexQuery(api.social.getForRestaurant, { restaurantId }, { skip: status.kind !== "ready" })
    if (snapshot === undefined || snapshot === null) {
        return undefined
    }
    return summarizeSocial(restaurantId, snapshot, viewer)
}

export const useToggleInterest = () => useConvexMutation(api.social.toggleInterest)
export const useToggleLike = () => useConvexMutation(api.social.toggleLike)
export const useAddComment = () => useConvexMutation(api.social.addComment)
export const useDeleteComment = () => useConvexMutation(api.social.deleteComment)

export const useFriends = () => {
    const status = useSessionStatus()
    return useConvexQuery(api.friendships.listFriends, undefined, { skip: status.kind !== "ready" })
}

export const useRequestFriendByEmail = () => useConvexMutation(api.friendships.requestFriendByEmail)
export const useAcceptFriend = () => useConvexMutation(api.friendships.acceptFriend)
export const useRemoveFriend = () => useConvexMutation(api.friendships.removeFriend)
