import { renderHook } from "@testing-library/react"
import { type ConvexReactClient } from "convex/react"
import { http, HttpResponse } from "msw"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex.context"

import { server } from "../vitest.msw.setup"
import { useUploadImage } from "./restaurants"

const uploadUrl = "https://example.convex.cloud/api/storage/token-abc"

type Captured = { contentType: string | null; calls: number }

function fakeClient(mutation: () => Promise<string>): ConvexReactClient {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test double exposing only mutation
    return { mutation } as unknown as ConvexReactClient
}

function renderUpload(client: ConvexReactClient | null) {
    return renderHook(() => useUploadImage(), {
        wrapper: ({ children }) => <ConvexProvider client={client}>{children}</ConvexProvider>,
    })
}

function serveUpload(captured: Captured, status = 200): void {
    server.use(
        http.post(uploadUrl, ({ request }) => {
            captured.calls += 1
            captured.contentType = request.headers.get("content-type")
            return status === 200 ? HttpResponse.json({ storageId: "storage-1" }) : new HttpResponse("nope", { status })
        }),
    )
}

async function issueUploadUrl(): Promise<string> {
    await Promise.resolve()
    return uploadUrl
}

const photo = (): File => new File(["pixels"], "a.jpg", { type: "image/jpeg" })

describe("useUploadImage", () => {
    test("posts the file to a fresh Convex upload url", async () => {
        const mutation = vi.fn<() => Promise<string>>(issueUploadUrl)
        const captured: Captured = { contentType: null, calls: 0 }
        serveUpload(captured)
        const { result } = renderUpload(fakeClient(mutation))

        const record = await result.current(photo())

        expect(mutation).toHaveBeenCalledTimes(1)
        expect(captured).toEqual({ contentType: "image/jpeg", calls: 1 })
        expect(record.storageId).toBe("storage-1")
        expect(record.url).toMatch(/^blob:/)
    })

    test("surfaces a failed upload", async () => {
        const captured: Captured = { contentType: null, calls: 0 }
        serveUpload(captured, 400)
        const { result } = renderUpload(fakeClient(issueUploadUrl))

        await expect(result.current(photo())).rejects.toThrow("Upload failed: 400")
    })

    test("refuses to upload without a Convex client", async () => {
        const captured: Captured = { contentType: null, calls: 0 }
        serveUpload(captured)
        const { result } = renderUpload(null)

        await expect(result.current(photo())).rejects.toThrow("Sign in to upload")
        expect(captured.calls).toBe(0)
    })
})
