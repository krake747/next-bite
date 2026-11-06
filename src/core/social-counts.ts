export type ReactionInterest = {
    readonly status: "want" | "been"
    readonly userId: string
    readonly displayName: string
}

export type ReactionLike = {
    readonly userId: string
}

export type ReactionCounts = {
    readonly wantCount: number
    readonly beenCount: number
    readonly wanted: boolean
    readonly likeCount: number
    readonly liked: boolean
    readonly interestedNames: string[]
}

export function countReactions(
    interests: ReadonlyArray<ReactionInterest>,
    likes: ReadonlyArray<ReactionLike>,
    userId: string | null,
): ReactionCounts {
    const wants = interests.filter((interest) => interest.status === "want")
    const beens = interests.filter((interest) => interest.status === "been")
    return {
        wantCount: wants.length,
        beenCount: beens.length,
        wanted: userId === null ? false : wants.some((interest) => interest.userId === userId),
        likeCount: likes.length,
        liked: userId === null ? false : likes.some((like) => like.userId === userId),
        interestedNames: interests.map((interest) => interest.displayName),
    }
}
