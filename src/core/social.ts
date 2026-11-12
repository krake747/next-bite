import { useConvexMutation, useSuspenseConvexQuery } from "@api/convex.context"
import { convexQueryOptions } from "@api/convex.options"
import { api } from "@api/endpoints"

export const useFriends = () => useSuspenseConvexQuery(api.social.friends)

export const useFriendRequests = () => useSuspenseConvexQuery(api.social.requests)

export const useRequestFriendByEmail = () => useConvexMutation(api.social.requestByEmail)
export const useAcceptFriend = () => useConvexMutation(api.social.accept)
export const useRemoveFriend = () => useConvexMutation(api.social.remove)

export function socialWarmups(): ReadonlyArray<object> {
    return [convexQueryOptions(api.social.friends), convexQueryOptions(api.social.requests)]
}
