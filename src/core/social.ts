import { api } from "../../convex/_generated/api"
import { type Id } from "../../convex/_generated/dataModel"
import { useAuth } from "./auth-provider"
import { useConvexMutation, useConvexQuery } from "./convex-client.tsx"

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

export function summarizeSocial(
    restaurantId: string,
    snapshot: SocialSnapshot,
    userId: string | null,
): RestaurantSocial {
    const interests = snapshot.interests.filter((interest) => interest.restaurantId === restaurantId)
    const likes = snapshot.likes.filter((like) => like.restaurantId === restaurantId)
    const comments = snapshot.comments
        .filter((comment) => comment.restaurantId === restaurantId)
        .toSorted((a, b) => a.createdAt - b.createdAt)
    const wants = interests.filter((interest) => interest.status === "want")
    const beens = interests.filter((interest) => interest.status === "been")
    return {
        wantCount: wants.length,
        beenCount: beens.length,
        wanted: userId === null ? false : wants.some((interest) => interest.userId === userId),
        likeCount: likes.length,
        liked: userId === null ? false : likes.some((like) => like.userId === userId),
        comments,
        interestedNames: interests.map((interest) => interest.displayName),
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

export function useSocialSummaries(
    restaurantIds: ReadonlyArray<Id<"restaurants">>,
): ReadonlyMap<string, RestaurantSocialSummary> | undefined {
    const { isAuthenticated } = useAuth()
    const summaries = useConvexQuery(
        api.social.getSummaries,
        { restaurantIds: [...restaurantIds] },
        { key: "social.getSummaries", skip: !isAuthenticated },
    )
    if (summaries === undefined) {
        return undefined
    }
    return new Map(summaries.map((summary) => [summary.restaurantId, summary]))
}

export function useSocialForRestaurant(
    restaurantId: Id<"restaurants">,
    userId: string | null,
): RestaurantSocial | undefined {
    const { isAuthenticated } = useAuth()
    const snapshot = useConvexQuery(
        api.social.getForRestaurant,
        { restaurantId },
        { key: "social.getForRestaurant", skip: !isAuthenticated },
    )
    if (snapshot === undefined) {
        return undefined
    }
    return summarizeSocial(restaurantId, snapshot, userId)
}

export const useToggleInterest = () => useConvexMutation(api.social.toggleInterest)
export const useToggleLike = () => useConvexMutation(api.social.toggleLike)
export const useAddComment = () => useConvexMutation(api.social.addComment)
export const useDeleteComment = () => useConvexMutation(api.social.deleteComment)
