import { betterAuth } from "better-auth"
import { emailOTP } from "better-auth/plugins"

import { createClient, type GenericCtx } from "@convex-dev/better-auth"
import { convex, crossDomain } from "@convex-dev/better-auth/plugins"

import { components } from "./_generated/api"
import { type DataModel } from "./_generated/dataModel"
import { query } from "./_generated/server"
import authConfig from "./auth.config"
import { sendOtpEmail } from "./email"
import { getValidatedConvexSiteUrl } from "./env"

const convexSiteUrl = getValidatedConvexSiteUrl()

function isPresent(value: string | undefined): boolean {
    return value !== undefined && value !== ""
}

function hasGoogleEnv(): boolean {
    return isPresent(process.env.GOOGLE_CLIENT_ID) && isPresent(process.env.GOOGLE_CLIENT_SECRET)
}

function hasGithubEnv(): boolean {
    return isPresent(process.env.GITHUB_CLIENT_ID) && isPresent(process.env.GITHUB_CLIENT_SECRET)
}

function isEmailOtpEnabled(): boolean {
    return process.env.AUTH_EMAIL_OTP_ENABLED === "true"
}

export const authComponent = createClient<DataModel>(components.betterAuth)

export const getAuthMethods = query({
    args: {},
    handler: () => ({
        password: true,
        google: hasGoogleEnv(),
        github: hasGithubEnv(),
        emailOtp: isEmailOtpEnabled(),
    }),
})

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
            ...(hasGoogleEnv()
                ? {
                      google: {
                          clientId: process.env.GOOGLE_CLIENT_ID ?? "",
                          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
                      },
                  }
                : {}),
            ...(hasGithubEnv()
                ? {
                      github: {
                          clientId: process.env.GITHUB_CLIENT_ID ?? "",
                          clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
                      },
                  }
                : {}),
        },
        plugins: [
            ...(isEmailOtpEnabled()
                ? [
                      emailOTP({
                          async sendVerificationOTP({ email, otp, type }) {
                              await sendOtpEmail(email, otp, type)
                          },
                          storeOTP: "hashed",
                      }),
                  ]
                : []),
            crossDomain({ siteUrl: convexSiteUrl }),
            convex({
                authConfig,
            }),
        ],
    })
}
