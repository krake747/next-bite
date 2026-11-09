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

export type Viewer = { readonly kind: "signed-in"; readonly id: string } | { readonly kind: "signed-out" }

export function countReactions(
    interests: ReadonlyArray<ReactionInterest>,
    likes: ReadonlyArray<ReactionLike>,
    viewer: Viewer,
): ReactionCounts {
    const wants = interests.filter((interest) => interest.status === "want")
    const beens = interests.filter((interest) => interest.status === "been")
    return {
        wantCount: wants.length,
        beenCount: beens.length,
        wanted: viewer.kind === "signed-in" ? wants.some((interest) => interest.userId === viewer.id) : false,
        likeCount: likes.length,
        liked: viewer.kind === "signed-in" ? likes.some((like) => like.userId === viewer.id) : false,
        interestedNames: interests.map((interest) => interest.displayName),
    }
}
