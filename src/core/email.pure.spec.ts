import { http, HttpResponse } from "msw"
import { afterEach, describe, expect, test, vi } from "vitest"

import { sendTransactionalEmail } from "@convex/email"

import { server } from "../vitest.msw.setup"

const input = { to: "alex@example.com", subject: "Your code", text: "Your Nextbite code is 123456." }

type CapturedCall = { method: string; url: string; headers: Headers; body: string }

function serveMail(status: number, body = "{}"): CapturedCall[] {
    const calls: CapturedCall[] = []
    server.use(
        http.post("https://api.eu.mailgun.net/v3/mg.example.com/messages", async ({ request }) => {
            calls.push({
                method: request.method,
                url: request.url,
                headers: request.headers,
                body: await request.text(),
            })
            return new HttpResponse(body, { status })
        }),
    )
    return calls
}

function stubMailEnv(values: { key: string; domain: string; fallback: string }): void {
    vi.stubEnv("MAILGUN_API_KEY", values.key)
    vi.stubEnv("MAILGUN_DOMAIN", values.domain)
    vi.stubEnv("MAILGUN_DEV_FALLBACK", values.fallback)
}

function errorMessageOf(error: unknown): string {
    if (!(error instanceof Error)) {
        throw new TypeError("Expected rejection with an Error")
    }
    return error.message
}

afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
})

describe("sendTransactionalEmail", () => {
    test("fails closed when mail is not configured", async () => {
        stubMailEnv({ key: "", domain: "", fallback: "" })
        const calls = serveMail(200)
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

        await expect(sendTransactionalEmail(input)).rejects.toThrow("not configured")
        expect(calls).toHaveLength(0)
        expect(warn).toHaveBeenCalledWith("sendTransactionalEmail refused: mail not configured")
    })

    test("delivers through the EU API when configured", async () => {
        stubMailEnv({ key: "test-key", domain: "mg.example.com", fallback: "" })
        const calls = serveMail(200)

        await sendTransactionalEmail(input)

        expect(calls).toHaveLength(1)
        const call = calls[0]
        expect(call?.method).toBe("POST")
        expect(call?.url).toBe("https://api.eu.mailgun.net/v3/mg.example.com/messages")
        expect(call?.headers.get("Content-Type")).toContain("application/x-www-form-urlencoded")
        expect(call?.headers.get("Authorization")).toMatch(/^Basic /)
        expect(call?.headers.get("Authorization")).not.toContain("test-key")
        const body = new URLSearchParams(calls.map((entry) => entry.body).join("&"))
        expect(body.get("from")).toBe("Nextbite <login@mg.example.com>")
        expect(body.get("to")).toBe("alex@example.com")
        expect(body.get("subject")).toBe("Your code")
    })

    test("fails on provider rejection without leaking the key or body", async () => {
        stubMailEnv({ key: "test-key", domain: "mg.example.com", fallback: "" })
        serveMail(401, "S3CR3T-provider-body")
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

        const error = await sendTransactionalEmail(input).catch((e: unknown) => e)
        expect(errorMessageOf(error)).toContain("delivery failed")
        expect(errorMessageOf(error)).not.toContain("test-key")
        expect(errorMessageOf(error)).not.toContain("S3CR3T-provider-body")
        expect(warn).toHaveBeenCalledWith("Mailgun delivery failed with status 401")
    })
})
