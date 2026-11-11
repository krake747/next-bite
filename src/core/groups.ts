import { useConvexMutation, useConvexQuery } from "@api/convex.context"
import { type Id } from "@api/data.model"
import { api } from "@api/endpoints"

import { useSessionStatus } from "./session"

export const useMyGroups = () => {
    const status = useSessionStatus()
    return useConvexQuery(api.groups.list, undefined, { skip: status.kind !== "ready" })
}

export const useRestaurantShares = (restaurantId: Id<"restaurants">) => {
    const status = useSessionStatus()
    return useConvexQuery(api.shares.listShares, { restaurantId }, { skip: status.kind !== "ready" })
}

export const useShareWithGroup = () => useConvexMutation(api.shares.shareWithGroup)
export const useUnshare = () => useConvexMutation(api.shares.unshare)
export const useCreateGroup = () => useConvexMutation(api.groups.create)

export const useCreateInvite = () => useConvexMutation(api.invites.create)
export const useAcceptInvite = () => useConvexMutation(api.invites.accept)
export const useRevokeInvite = () => useConvexMutation(api.invites.revoke)

export function isSafeRedirectPath(value: string | null | undefined): value is string {
    if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
        return false
    }
    const exact = new Set(["/", "/home", "/friends", "/add", "/groups", "/you", "/account"])
    if (exact.has(value)) {
        return true
    }
    return value.startsWith("/invite/") || value.startsWith("/groups/") || value.startsWith("/restaurants/")
}
