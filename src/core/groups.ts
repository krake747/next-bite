import { useConvexMutation, useConvexQuery } from "@api/convex.client"
import { type Id } from "@api/data.model"
import { api } from "@api/endpoints"

import { useSessionStatus } from "./session"

export const useMyGroups = () => {
    const status = useSessionStatus()
    return useConvexQuery(api.groups.listMyGroups, undefined, { skip: status.kind !== "ready" })
}

export const useRestaurantShares = (restaurantId: Id<"restaurants">) => {
    const status = useSessionStatus()
    return useConvexQuery(api.shares.listShares, { restaurantId }, { skip: status.kind !== "ready" })
}

export const useShareWithGroup = () => useConvexMutation(api.shares.shareWithGroup)
export const useShareWithUser = () => useConvexMutation(api.shares.shareWithUser)
export const useUnshare = () => useConvexMutation(api.shares.unshare)
export const useCreateGroup = () => useConvexMutation(api.groups.createGroup)

export const useCreateInvite = () => useConvexMutation(api.invitations.createInvite)
export const useAcceptInvite = () => useConvexMutation(api.invitations.acceptInvite)
export const useRevokeInvite = () => useConvexMutation(api.invitations.revokeInvite)

export function isSafeRedirectPath(value: string | null | undefined): value is string {
    if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
        return false
    }
    return value === "/" || value.startsWith("/invite/") || value.startsWith("/groups/") || value === "/groups"
}
