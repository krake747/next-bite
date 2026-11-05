import { betterAuth } from "better-auth"
import { emailOTP } from "better-auth/plugins"

import { createClient, type GenericCtx } from "@convex-dev/better-auth"
import { convex, crossDomain } from "@convex-dev/better-auth/plugins"

import { components } from "./_generated/api"
import { type DataModel } from "./_generated/dataModel"
import authConfig from "./auth.config"
import { sendOtpEmail } from "./email"
import { getValidatedConvexSiteUrl } from "./env"

const convexSiteUrl = getValidatedConvexSiteUrl()

function googleProvider(): { google: { clientId: string; clientSecret: string } } | Record<string, never> {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    if (clientId === undefined || clientId === "" || clientSecret === undefined || clientSecret === "") {
        console.log("createAuth: GOOGLE_CLIENT_ID/SECRET not set, Google OAuth disabled")
        return {}
    }
    return { google: { clientId, clientSecret } }
}

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
        socialProviders: {
            ...googleProvider(),
        },
        plugins: [
            emailOTP({
                async sendVerificationOTP({ email, otp, type }) {
                    await sendOtpEmail(email, otp, type)
                },
                storeOTP: "hashed",
            }),
            crossDomain({ siteUrl: convexSiteUrl }),
            convex({
                authConfig,
            }),
        ],
    })
}
