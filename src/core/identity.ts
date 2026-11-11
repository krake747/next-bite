import { useEffect } from "react"

import { useAuthContext } from "@api/auth.provider"
import { useConvexClient, useConvexMutation, useConvexQuery, useSuspenseConvexQuery } from "@api/convex.context"
import { type Doc } from "@api/data.model"
import { api } from "@api/endpoints"

import { useSessionKey, useSessionStatus } from "./session"
import { type Viewer } from "./viewer"

export { isViewer, type Viewer } from "./viewer"

export const useMe = () => useSuspenseConvexQuery(api.identity.me)

export const useRename = () => useConvexMutation(api.identity.rename)

export const useSetAvatar = () => useConvexMutation(api.identity.setAvatar)

export const useRemoveAvatar = () => useConvexMutation(api.identity.removeAvatar)

export function useViewerProfile(): Doc<"profiles"> | undefined {
    const status = useSessionStatus()
    const me = useConvexQuery(api.identity.me, undefined, { skip: status.kind !== "ready" })
    return me?.status === "ready" ? me.profile : undefined
}

export function useViewer(): Viewer {
    const profile = useViewerProfile()
    return profile === undefined ? { kind: "signed-out" } : { kind: "signed-in", id: profile._id }
}

export function useEnsureProfile(): void {
    const auth = useAuthContext()
    const client = useConvexClient()
    const sessionKey = useSessionKey()
    useEffect(() => {
        // See ADR-0025: ready session only, silent fallback.
        if (sessionKey === null || client === null) {
            return
        }
        const user = auth.user
        if (user === null || user.id !== sessionKey) {
            return
        }
        const { email, name } = user
        void client
            .mutation(api.identity.ensureProfile, {
                email,
                ...(name !== undefined && name !== null ? { name } : {}),
            })
            .catch(() => {})
    }, [sessionKey, client, auth.user])
}
