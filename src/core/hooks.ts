import { useLiveQuery } from "@tanstack/react-db"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type ConvexClient } from "convex/browser"
import { useEffect, useState } from "react"

import { api } from "@convex/_generated/api"
import { type Doc, type Id } from "@convex/_generated/dataModel"

import { getConvexSessionToken } from "./auth-client"
import { useAuth as useAuthSource } from "./auth-provider"
import { FALLBACK_DISPLAY_NAME } from "./constants"
import { useConvexClient, useConvexQuery, useConvexMutation, useConvexAction } from "./convex-client.tsx"
import {
    applyUpdateArgsToDraft,
    assertRealRestaurantId,
    buildTempRestaurant,
    clearUserScopedQueries,
    getSessionCollections,
    persistCallerFor,
    resolveRestaurantIdByKey,
    type RestaurantAddArgs,
    type RestaurantUpdateArgs,
} from "./db/restaurants"
import { env } from "./env"
import { parseImageRecord, type ImageRecord } from "./schemas"

async function sleep(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
        setTimeout(resolve, ms)
    })
}

async function probeConvexAuth(client: ConvexClient): Promise<boolean> {
    const token = await getConvexSessionToken()
    if (token === null) {
        return false
    }
    try {
        await client.query(api.friendships.listFriends, {})
        return true
    } catch {
        return false
    }
}

const CONVEX_AUTH_TIMEOUT_MS = 10000

async function settleConvexAuth(client: ConvexClient, isCancelled: () => boolean): Promise<void> {
    const deadline = Date.now() + CONVEX_AUTH_TIMEOUT_MS
    while (!isCancelled()) {
        if (await probeConvexAuth(client)) {
            return
        }
        if (Date.now() >= deadline) {
            return
        }
        await sleep(500)
    }
}

function useSessionKey(): string | null {
    const status = useSessionStatus()
    return status.kind === "ready" ? status.userId : null
}

export type SessionStatus = { kind: "loading" } | { kind: "signed-out" } | { kind: "ready"; userId: string }

export function useSessionStatus(): SessionStatus {
    const { isAuthenticated, isLoading, user } = useAuthSource()
    const client = useConvexClient()
    const [convexReady, setConvexReady] = useState(false)
    const sessionKey = !isAuthenticated || isLoading || user === null ? null : user.id
    useEffect(() => {
        let cancelled = false
        if (sessionKey === null || client === null) {
            setConvexReady(false)
        } else {
            // Past the deadline the gate opens anyway; the backend still enforces every rule.
            void settleConvexAuth(client, () => cancelled).then(() => {
                if (!cancelled) {
                    setConvexReady(true)
                }
            })
        }
        return () => {
            cancelled = true
        }
    }, [sessionKey, client])
    if (sessionKey === null) {
        return isLoading ? { kind: "loading" } : { kind: "signed-out" }
    }
    return convexReady ? { kind: "ready", userId: sessionKey } : { kind: "loading" }
}

function useOwnerOrFeed(kind: "owner" | "feed"): ReadonlyArray<Doc<"restaurants">> | undefined {
    const sessionKey = useSessionKey()
    const client = useConvexClient()
    const queryClient = useQueryClient()
    useEffect(() => {
        // Any session transition, including first mount, drops the previous session's user-scoped
        // query entries. The query cache is client-populated only (no SSR dehydration), so
        // clearing on mount is a no-op for fresh clients.
        clearUserScopedQueries((filters) => {
            queryClient.removeQueries(filters)
        })
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
    if (gated || result.isLoading) {
        return undefined
    }
    return result.data ?? undefined
}

export const useRestaurants = () => useOwnerOrFeed("owner")
export const useFeedRestaurants = () => useOwnerOrFeed("feed")
export const useVisibleRestaurant = (id: Id<"restaurants">) => {
    const status = useSessionStatus()
    return useConvexQuery(api.restaurants.getById, { id }, { skip: status.kind === "loading" })
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
