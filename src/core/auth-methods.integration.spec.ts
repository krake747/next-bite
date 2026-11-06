import { convexTest, type TestConvexForDataModel } from "convex-test"
import { describe, expect, test, vi } from "vitest"

import { api } from "@convex/_generated/api"
import { type DataModel } from "@convex/_generated/dataModel"
import schema from "@convex/schema"

vi.stubEnv("CONVEX_SITE_URL", "https://example.convex.site")
vi.stubEnv("GOOGLE_CLIENT_ID", "")
vi.stubEnv("GOOGLE_CLIENT_SECRET", "")
vi.stubEnv("GITHUB_CLIENT_ID", "")
vi.stubEnv("GITHUB_CLIENT_SECRET", "")
vi.stubEnv("AUTH_EMAIL_OTP_ENABLED", "false")

const modules = import.meta.glob("../../convex/**/*.ts")

function setup(): TestConvexForDataModel<DataModel> {
    // oxlint-disable-next-line typescript/no-unsafe-assignment -- convex-test factory is untyped at the module-glob boundary; the annotation restores safety for all callers
    return convexTest(schema, modules)
}

describe("auth methods", () => {
    test("defaults to password-only so contributors need zero auth setup", async () => {
        const t = setup()
        await expect(t.query(api.auth.getAuthMethods, {})).resolves.toEqual({
            password: true,
            google: false,
            github: false,
            emailOtp: false,
        })
    })
})
