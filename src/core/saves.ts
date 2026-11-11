import { useConvexMutation } from "@api/convex.context"
import { type Id } from "@api/data.model"
import { api } from "@api/endpoints"

export type SaveStatus = "want" | "been"

export const useSetSave = () => useConvexMutation(api.places.setSave)

export function useToggleWant(placeId: Id<"places">, mySave: SaveStatus | null): () => void {
    const setSave = useSetSave()
    return () => {
        setSave.mutate({ placeId, status: mySave === "want" ? null : "want" })
    }
}

export function orderFeedByRecency<Place extends { readonly _creationTime: number }>(
    places: ReadonlyArray<Place>,
): Place[] {
    return [...places].toSorted((a, b) => b._creationTime - a._creationTime)
}

export function feedTextFor(name: string, note: string | undefined): string {
    const trimmed = note?.trim() ?? ""
    return trimmed === "" ? `Added ${name}.` : trimmed
}
