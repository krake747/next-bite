import { afterEach, describe, expect, it, vi } from "vitest"

import { hasMailgunConfig, isMailDevFallback, sendTransactionalEmail } from "@convex/email"

const input = { to: "alex@example.com", subject: "Your code", text: "Your Nextbite code is 123456." }

type FetchMock = ReturnType<typeof vi.fn<(url: string, init: RequestInit) => Promise<Response>>>

function stubFetchOnce(status: number, body = "{}"): FetchMock {
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
    fetchMock.mockResolvedValue(new Response(body, { status }))
    vi.stubGlobal("fetch", fetchMock)
    return fetchMock
}

function fetchInitOf(mock: FetchMock): RequestInit {
    const call = mock.mock.calls[0]
    if (call === undefined) {
        throw new TypeError("Expected fetch to be called once")
    }
    return call[1]
}

function fetchUrlOf(mock: FetchMock): string {
    const call = mock.mock.calls[0]
    if (call === undefined) {
        throw new TypeError("Expected fetch to be called once")
    }
    return call[0]
}

function formBodyOf(init: RequestInit): URLSearchParams {
    if (!(init.body instanceof URLSearchParams)) {
        throw new TypeError("Expected URL-encoded form body")
    }
    return init.body
}

function errorMessageOf(error: unknown): string {
    if (!(error instanceof Error)) {
        throw new TypeError("Expected rejection with an Error")
    }
    return error.message
}

afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe("mail configuration", () => {
    it("reports missing configuration without secrets", () => {
        vi.stubEnv("MAILGUN_API_KEY", "")
        vi.stubEnv("MAILGUN_DOMAIN", "")
        vi.stubEnv("MAILGUN_DEV_FALLBACK", "")

        expect(hasMailgunConfig()).toBe(false)
        expect(isMailDevFallback()).toBe(false)
    })
})

describe("sendTransactionalEmail", () => {
    it("fails closed when mail is not configured", async () => {
        vi.stubEnv("MAILGUN_API_KEY", "")
        vi.stubEnv("MAILGUN_DOMAIN", "")
        vi.stubEnv("MAILGUN_DEV_FALLBACK", "")
        const fetchMock = stubFetchOnce(200)

        await expect(sendTransactionalEmail(input)).rejects.toThrow("not configured")
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it("uses the explicit local fallback without logging OTP content", async () => {
        vi.stubEnv("MAILGUN_API_KEY", "")
        vi.stubEnv("MAILGUN_DOMAIN", "")
        vi.stubEnv("MAILGUN_DEV_FALLBACK", "true")
        const fetchMock = stubFetchOnce(200)
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})

        await sendTransactionalEmail(input)

        expect(fetchMock).not.toHaveBeenCalled()
        for (const call of logSpy.mock.calls) {
            expect(JSON.stringify(call)).not.toContain("123456")
            expect(JSON.stringify(call)).not.toContain("alex@example.com")
        }
    })

    it("delivers through the EU API when configured", async () => {
        vi.stubEnv("MAILGUN_API_KEY", "test-key")
        vi.stubEnv("MAILGUN_DOMAIN", "mg.example.com")
        vi.stubEnv("MAILGUN_DEV_FALLBACK", "")
        const fetchMock = stubFetchOnce(200)

        await sendTransactionalEmail(input)

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(fetchUrlOf(fetchMock)).toBe("https://api.eu.mailgun.net/v3/mg.example.com/messages")
        const init = fetchInitOf(fetchMock)
        expect(init.method).toBe("POST")
        const headers = new Headers(init.headers)
        expect(headers.get("Content-Type")).toContain("application/x-www-form-urlencoded")
        expect(headers.get("Authorization")).toMatch(/^Basic /)
        expect(JSON.stringify(init.headers)).not.toContain("test-key")
        const body = formBodyOf(init)
        expect(body.get("from")).toBe("Nextbite <login@mg.example.com>")
        expect(body.get("to")).toBe("alex@example.com")
        expect(body.get("subject")).toBe("Your code")
    })

    it("fails on provider rejection without leaking the key or body", async () => {
        vi.stubEnv("MAILGUN_API_KEY", "test-key")
        vi.stubEnv("MAILGUN_DOMAIN", "mg.example.com")
        vi.stubEnv("MAILGUN_DEV_FALLBACK", "")
        stubFetchOnce(401, "S3CR3T-provider-body")

        const error = await sendTransactionalEmail(input).catch((e: unknown) => e)
        expect(errorMessageOf(error)).toContain("delivery failed")
        expect(errorMessageOf(error)).not.toContain("test-key")
        expect(errorMessageOf(error)).not.toContain("S3CR3T-provider-body")
    })
})
