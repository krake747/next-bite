import { betterAuth } from "better-auth"
import { emailOTP } from "better-auth/plugins"

import { createClient, type GenericCtx } from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"

import { components } from "./_generated/api"
import { type DataModel } from "./_generated/dataModel"
import { query } from "./_generated/server"
import authConfig from "./auth.config"
import { sendOtpEmail } from "./email"
import { appOrigins, getValidatedSiteUrl, hasMailgunConfig, isEmailOtpEnabled, isMailDevFallback } from "./env"

export const authComponent = createClient<DataModel>(components.betterAuth)

// See ADR-0005: capability flags only.
export const getAuthMethods = query({
    args: {},
    handler: () => ({
        password: true,
        emailOtp: isEmailOtpEnabled() && (hasMailgunConfig() || isMailDevFallback()),
    }),
})

export const createAuth = (ctx: GenericCtx<DataModel>) => {
    // registerRoutes builds one static instance at module load just to read basePath,
    // passing an empty object as ctx. Fresh deployments have no env vars yet, so the
    // static call gets a swap-in baseURL and the push succeeds. Every real request
    // builds its own instance below with the live env, and a missing SITE_URL still
    // throws there. Keyed on emptiness, not on ctx shape: HTTP action ctx has no db.
    const staticRegistration = Object.keys(ctx).length === 0
    const siteUrl = staticRegistration ? "http://localhost" : getValidatedSiteUrl()
    return betterAuth({
        baseURL: siteUrl,
        trustedOrigins: [...new Set([siteUrl, ...appOrigins()])],
        database: authComponent.adapter(ctx),
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false,
            autoSignIn: true,
            minPasswordLength: 8,
        },
        plugins: [
            ...(isEmailOtpEnabled() && (hasMailgunConfig() || isMailDevFallback())
                ? [
                      emailOTP({
                          async sendVerificationOTP({ email, otp, type }) {
                              await sendOtpEmail(email, otp, type)
                          },
                          storeOTP: "hashed",
                      }),
                  ]
                : []),
            convex({
                authConfig,
            }),
        ],
    })
}
