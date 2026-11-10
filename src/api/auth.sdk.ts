import { emailOTPClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import { convexClient } from "@convex-dev/better-auth/client/plugins"

export const authClient = createAuthClient({
    plugins: [convexClient(), emailOTPClient()],
})

export async function getConvexSessionToken(): Promise<string | null> {
    const { data } = await authClient.convex.token({ fetchOptions: { throw: false } })
    return data?.token ?? null
}
