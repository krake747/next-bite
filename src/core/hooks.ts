import { useLiveQuery } from "@tanstack/react-db"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type ConvexReactClient } from "convex/react"
import { useEffect, useRef } from "react"

import { getConvexSessionToken } from "@api/auth-client"
import { useAuth as useAuthSource } from "@api/auth-provider"
import {
    useConvexClient,
    useConvexQuery,
    useConvexQueryResult,
    useConvexMutation,
    useConvexAction,
} from "@api/convex-client"
import { type Doc, type Id } from "@api/data-model"
import {
    applyUpdateArgsToDraft,
    assertRealRestaurantId,
    buildTempRestaurant,
    claimSessionCache,
    dropSessionCollections,
    getSessionCollections,
    persistCallerFor,
    resolveRestaurantIdByKey,
    type RestaurantAddArgs,
    type RestaurantUpdateArgs,
} from "@api/db/restaurants"
import { api } from "@api/endpoints"

import { FALLBACK_DISPLAY_NAME } from "./constants"
import { env } from "./env"
import { parseImageRecord, type ImageRecord } from "./schemas"
import { retrySessionGate, useSessionKey, useSessionStatus } from "./session"

export { useSessionStatus } from "./session"
export type { SessionStatus } from "./session"

function useSessionSyncRecovery(
    input: Readonly<{
        gated: boolean
        sessionKey: string | null
        client: ConvexReactClient | null
        isLoadingError: boolean
        isSyncError: boolean
        status: string
        hasData: boolean
    }>,
): void {
    const { gated, sessionKey, client, isLoadingError, isSyncError, status, hasData } = input
    const syncFailed = !gated && (isLoadingError || isSyncError || status === "error" || status === "crashed")
    const failedRef = useRef(false)
    useEffect(() => {
        // A failed sync poisons the cached collections (typically an expired
        // Convex token mid-session). Evict the session cache so the next read
        // subscribes fresh, and re-verify auth: success restores the same
        // user's live data, failure surfaces the timeout notice with a retry.
        // Edge-triggered per failure episode; the latch only clears once the
        // collection serves data again, so a still-broken backend cannot loop.
        if (syncFailed && !failedRef.current && sessionKey !== null && client !== null) {
            failedRef.current = true
            dropSessionCollections(client, sessionKey)
            retrySessionGate()
        } else if (!syncFailed && hasData) {
            failedRef.current = false
        }
    }, [syncFailed, sessionKey, client, hasData, gated])
}

function useOwnerOrFeed(kind: "owner" | "feed"): ReadonlyArray<Doc<"restaurants">> | undefined {
    const sessionKey = useSessionKey()
    const client = useConvexClient()
    const queryClient = useQueryClient()
    useEffect(() => {
        // Evict only when a ready session takes over a cache owned by another session. Skips
        // probing mounts and owner matches, so components that mount on loaded data keep it.
        claimSessionCache(
            (filters) => {
                queryClient.removeQueries(filters)
            },
            queryClient,
            sessionKey,
        )
    }, [queryClient, sessionKey])
    const gated = sessionKey === null || client === null
    const collections =
        gated || client === null ? null : getSessionCollections(client, persistCallerFor(client), sessionKey)
    const collection = collections === null ? null : collections[kind]
    const result = useLiveQuery(() => collection)
    useEffect(() => {
        if (collection !== null) {
            void collection.preload()
        }
    }, [collection])
    useSessionSyncRecovery({
        gated,
        sessionKey,
        client,
        isLoadingError: result.isLoadingError,
        isSyncError: result.isSyncError,
        status: result.status,
        hasData: result.data !== undefined,
    })
    if (gated || result.isLoading) {
        return undefined
    }
    return result.data ?? undefined
}

export const useRestaurants = () => useOwnerOrFeed("owner")
export const useFeedRestaurants = () => useOwnerOrFeed("feed")
export const useVisibleRestaurant = (id: Id<"restaurants">) => {
    const status = useSessionStatus()
    // Signed-out readers stay open: this query serves public restaurant detail.
    // Timeouts stay closed until the session re-verifies.
    return useConvexQueryResult(
        api.restaurants.getById,
        { id },
        { skip: status.kind === "loading" || status.kind === "timed-out" },
    )
}
export const useFriends = () => {
    const status = useSessionStatus()
    return useConvexQuery(api.friendships.listFriends, undefined, { skip: status.kind !== "ready" })
}

export const useMyProfile = () => {
    const status = useSessionStatus()
    return useConvexQuery(api.users.getMe, undefined, { skip: status.kind !== "ready" })
}

export const useMyStatuses = () => {
    const status = useSessionStatus()
    return useConvexQuery(api.social.listMyStatuses, undefined, { skip: status.kind !== "ready" })
}

export const useUpdateProfile = () => useConvexMutation(api.users.updateMe)

export const useFriendDiscoveries = (friendAuthUserId: string) => {
    const status = useSessionStatus()
    return useConvexQuery(api.friendships.listDiscoveries, { friendAuthUserId }, { skip: status.kind !== "ready" })
}

export const useFriendRequests = () => {
    const status = useSessionStatus()
    return useConvexQuery(api.friendships.listFriendRequests, undefined, { skip: status.kind !== "ready" })
}

export const useRequestFriendByEmail = () => useConvexMutation(api.friendships.requestFriendByEmail)
export const useAcceptFriend = () => useConvexMutation(api.friendships.acceptFriend)
export const useRemoveFriend = () => useConvexMutation(api.friendships.removeFriend)

export function useEnsureProfile(): void {
    const auth = useAuthSource()
    const client = useConvexClient()
    const sessionKey = useSessionKey()
    useEffect(() => {
        // Profiles back display names and email lookup. Signups create the auth session but no
        // profile row, so every ready session ensures one exactly once. The readiness gate
        // matters: firing pre-install runs the mutation unauthenticated. Failures stay silent:
        // callers already fall back to placeholder names.
        if (sessionKey === null || client === null) {
            return
        }
        const user = auth.user
        if (user === null || user.id !== sessionKey) {
            return
        }
        const { email, name } = user
        void client
            .mutation(api.users.ensureProfile, {
                email,
                ...(name !== undefined && name !== null ? { name } : {}),
            })
            .catch(() => {})
    }, [sessionKey, client, auth.user])
}

export const useMyGroups = () => {
    const status = useSessionStatus()
    return useConvexQuery(api.groups.listMyGroups, undefined, { skip: status.kind !== "ready" })
}

export const useGroup = (groupId: Id<"groups">) => {
    const status = useSessionStatus()
    return useConvexQuery(api.groups.getGroup, { groupId }, { skip: status.kind !== "ready" })
}

export const useGroupRestaurants = (groupId: Id<"groups"> | null | undefined) => {
    const status = useSessionStatus()
    const skip = status.kind !== "ready" || groupId === null || groupId === undefined
    return useConvexQuery(api.shares.listForGroup, skip ? undefined : { groupId }, { skip })
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
export const useCreatePlan = () => useConvexMutation(api.plans.createPlan)
export const useUpdatePlanStatus = () => useConvexMutation(api.plans.updatePlanStatus)

export function usePlansForGroup(groupId: Id<"groups"> | null | undefined) {
    const status = useSessionStatus()
    const skip = status.kind !== "ready" || groupId === null || groupId === undefined
    return useConvexQuery(
        api.plans.listPlansForGroup,
        skip || groupId === null || groupId === undefined ? undefined : { groupId },
        {
            skip,
        },
    )
}

export function usePlansForRestaurant(restaurantId: Id<"restaurants"> | null | undefined) {
    const status = useSessionStatus()
    const skip = status.kind !== "ready" || restaurantId === null || restaurantId === undefined
    return useConvexQuery(
        api.plans.listPlansForRestaurant,
        skip || restaurantId === null || restaurantId === undefined ? undefined : { restaurantId },
        {
            skip,
        },
    )
}

export function useInvitePreview(token: string | null | undefined) {
    return useConvexQuery(api.invitations.getInvite, token ? { token, now: Date.now() } : undefined, {
        skip: token === null || token === undefined || token === "",
    })
}

export function isSafeRedirectPath(value: string | null | undefined): value is string {
    if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
        return false
    }
    return value === "/" || value.startsWith("/invite/") || value.startsWith("/groups/") || value === "/groups"
}

export const useVisitMemories = (restaurantId: Id<"restaurants"> | null | undefined) => {
    const status = useSessionStatus()
    const skip = status.kind !== "ready" || restaurantId === null || restaurantId === undefined
    return useConvexQuery(api.restaurants.listVisitMemories, skip ? undefined : { restaurantId }, { skip })
}

export const useAddVisitMemory = () => useConvexMutation(api.restaurants.addVisitMemory)

export const useLandingStats = () => useConvexQuery(api.landing.getStats)

export type AuthMethods = {
    readonly password: boolean
    readonly google: boolean
    readonly github: boolean
    readonly emailOtp: boolean
}

export const useAuthMethods = (): AuthMethods | undefined => useConvexQuery(api.auth.getAuthMethods)

export function useAddRestaurantWithHours() {
    const client = useConvexClient()
    const auth = useAuthSource()
    return useMutation({
        mutationFn: async (args: RestaurantAddArgs): Promise<Id<"restaurants">> => {
            if (client === null || !auth.isAuthenticated || auth.user === null) {
                throw new Error("Sign in to add restaurants")
            }
            const collections = getSessionCollections(client, persistCallerFor(client), auth.user.id)
            // The persisted key correlates the temp row with its synced server row and makes
            // double-submits idempotent; the backend dedupes retries carrying the same key.
            // A caller-supplied key survives retries, otherwise mint one per attempt.
            const clientMutationId = args.clientMutationId ?? crypto.randomUUID()
            const temp = buildTempRestaurant({
                ownerId: auth.user.id,
                ownerName: auth.user.name ?? FALLBACK_DISPLAY_NAME,
                ...args,
                clientMutationId,
            })
            const tx = collections.owner.insert(temp)
            // The rejection surfaces via tx.state below; swallowing here avoids an
            // unhandled rejection while the definitive error is thrown next.
            await tx.when("settled").catch(() => {})
            if (tx.state === "failed") {
                throw tx.error?.error ?? new Error("Add failed")
            }
            return resolveRestaurantIdByKey(collections.owner, clientMutationId)
        },
    })
}

export function useUpdateRestaurant() {
    const client = useConvexClient()
    const sessionKey = useSessionKey()
    return useMutation({
        mutationFn: async (args: RestaurantUpdateArgs) => {
            assertRealRestaurantId(args.id)
            if (client === null || sessionKey === null) {
                throw new Error("Sign in to edit restaurants")
            }
            const collections = getSessionCollections(client, persistCallerFor(client), sessionKey)
            const targets = [collections.owner, collections.feed].filter((collection) => collection.has(args.id))
            if (targets.length === 0) {
                await client.mutation(api.restaurants.update, args)
                return
            }
            for (const target of targets) {
                const tx = target.update(args.id, (draft) => {
                    applyUpdateArgsToDraft(draft, args)
                })
                await tx.when("settled")
                if (tx.state === "failed") {
                    throw tx.error?.error ?? new Error("Update failed")
                }
            }
        },
    })
}

export function useDeleteRestaurant() {
    const client = useConvexClient()
    const sessionKey = useSessionKey()
    return useMutation({
        mutationFn: async (args: { id: Id<"restaurants"> }) => {
            assertRealRestaurantId(args.id)
            if (client === null || sessionKey === null) {
                throw new Error("Sign in to delete restaurants")
            }
            await client.mutation(api.restaurants.remove, args)
        },
    })
}

export const useDeleteImage = () => useConvexMutation(api.restaurants.deleteImage)
export const useCleanupStorage = () => useConvexMutation(api.restaurants.cleanupStorage)
export const useRefreshOpeningHours = () => useConvexAction(api.restaurants.refreshOpeningHours)
export const useLookupPlaceIdAndHours = () => useConvexAction(api.restaurants.lookupPlaceIdAndHours)

export function useUploadImage() {
    return async (file: Readonly<File>): Promise<ImageRecord> => {
        const token = await getConvexSessionToken()
        if (token === null) {
            throw new Error("Sign in to upload photos")
        }
        const uploadUrl = `${env.VITE_CONVEX_SITE_URL}/upload`

        const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type, Authorization: `Bearer ${token}` },
            body: file,
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Upload failed: ${response.status} ${errorText}`)
        }

        const result = parseImageRecord(await response.json())
        return { url: result.url, storageId: result.storageId }
    }
}

export const useAuth = useAuthSource
export type { ImageRecord } from "./schemas"

export type Restaurant = Doc<"restaurants">
