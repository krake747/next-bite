import { useConvexMutation, useConvexQuery, useSuspenseConvexQuery } from "@api/convex.context"
import { convexQueryOptions } from "@api/convex.options"
import { type Id } from "@api/data.model"
import { api } from "@api/endpoints"

import { useSessionStatus } from "./session"

export const useMyGroups = () => {
    const status = useSessionStatus()
    return useConvexQuery(api.groups.list, undefined, { skip: status.kind !== "ready" })
}

export const useGroupPlaces = (groupId: Id<"groups">) => {
    const status = useSessionStatus()
    return useConvexQuery(api.places.forGroup, { groupId }, { skip: status.kind !== "ready" })
}

export const useAddToGroup = () => useConvexMutation(api.places.addToGroup)
export const useRemoveFromGroup = () => useConvexMutation(api.places.removeFromGroup)
export const useCreateGroup = () => useConvexMutation(api.groups.create)

export const useCreateInvite = () => useConvexMutation(api.invites.create)
export const useAcceptInvite = () => useConvexMutation(api.invites.accept)
export const useRevokeInvite = () => useConvexMutation(api.invites.revoke)

export const useGroupsListSuspense = () => useSuspenseConvexQuery(api.groups.list)

export const useGroupSuspense = (groupId: Id<"groups">) => useSuspenseConvexQuery(api.groups.get, { groupId })

export const useGroupPlacesSuspense = (groupId: Id<"groups">) =>
    useSuspenseConvexQuery(api.places.forGroup, { groupId })

export const useInvitePreview = (token: string) => useSuspenseConvexQuery(api.invites.get, { token, now: Date.now() })

export function groupsListWarmups(): ReadonlyArray<object> {
    return [convexQueryOptions(api.groups.list)]
}

export function groupDetailWarmups(groupId: Id<"groups">): ReadonlyArray<object> {
    return [convexQueryOptions(api.groups.get, { groupId }), convexQueryOptions(api.places.forGroup, { groupId })]
}

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
