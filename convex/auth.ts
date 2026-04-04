import { createClient, type GenericCtx } from "@convex-dev/better-auth"
import { convex, crossDomain } from "@convex-dev/better-auth/plugins"
import { components } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"
import { betterAuth } from "better-auth"
import authConfig from "./auth.config"
import { getValidatedConvexSiteUrl } from "./env"

const convexSiteUrl = getValidatedConvexSiteUrl()

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
    return betterAuth({
        baseURL: convexSiteUrl,
        trustedOrigins: [convexSiteUrl, "http://localhost:5173", "https://nextbite.kevinkraemer.com"],
        database: authComponent.adapter(ctx),
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false,
            autoSignIn: true,
            minPasswordLength: 8,
        },
        plugins: [
            crossDomain({ siteUrl: convexSiteUrl }),
            convex({
                authConfig,
            }),
        ],
    })
}
