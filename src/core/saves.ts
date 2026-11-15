import { useConvexMutation } from "@api/convex.context"
import { type Id } from "@api/data.model"
import { api } from "@api/endpoints"

export type SaveStatus = "want" | "been"

export const useSetSave = () => useConvexMutation(api.places.setSave)

export function useToggleWant(restaurantId: Id<"places">, mySave: SaveStatus | null): () => void {
    const setSave = useSetSave()
    return () => {
        setSave.mutate({ placeId: restaurantId, status: mySave === "want" ? null : "want" })
    }
}

export function useToggleBeen(restaurantId: Id<"places">, mySave: SaveStatus | null): () => void {
    const setSave = useSetSave()
    return () => {
        setSave.mutate({ placeId: restaurantId, status: mySave === "been" ? null : "been" })
    }
}

export function orderFeedByRecency<Restaurant extends { readonly _creationTime: number }>(
    restaurants: ReadonlyArray<Restaurant>,
): Restaurant[] {
    return [...restaurants].toSorted((a, b) => b._creationTime - a._creationTime)
}

export function friendUpdateTextFor(name: string, note: string | undefined): string {
    const trimmed = note?.trim() ?? ""
    return trimmed === "" ? `Added ${name}.` : trimmed
}
