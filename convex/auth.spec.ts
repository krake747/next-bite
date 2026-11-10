import { afterEach, expect, test } from "vitest"

import { createAuth } from "./auth"

type Ctx = Parameters<typeof createAuth>[0]

const savedSiteUrl = process.env.SITE_URL

afterEach(() => {
    if (savedSiteUrl === undefined) {
        delete process.env.SITE_URL
    } else {
        process.env.SITE_URL = savedSiteUrl
    }
})

test("static route registration does not need SITE_URL", () => {
    delete process.env.SITE_URL
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- registerRoutes itself calls createAuth({}); the static path never touches ctx
    const auth = createAuth({} as unknown as Ctx)
    expect(typeof auth.handler).toBe("function")
})

test("real auth calls still require SITE_URL", () => {
    delete process.env.SITE_URL
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- fake ctx only exercises the env gate; createAuth throws before touching ctx
    expect(() => createAuth({ db: {} } as unknown as Ctx)).toThrow("SITE_URL")
})
