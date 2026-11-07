import { renderHook } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { describe, expect, test, vi } from "vitest"

import { getConvexSessionToken } from "@api/auth.sdk"

import { server } from "../vitest.msw.setup"
import { useUploadImage } from "./restaurants"

vi.mock("@api/auth.sdk", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth.sdk")>()
    return { ...original, getConvexSessionToken: vi.fn<() => Promise<string | null>>() }
})

const uploadUrl = "https://example.convex.site/upload"

function serveUpload(captured: { auth: string | null; calls: number }): void {
    server.use(
        http.post(uploadUrl, ({ request }) => {
            captured.calls += 1
            captured.auth = request.headers.get("authorization")
            return HttpResponse.json({ url: "https://example.com/a.jpg", storageId: "storage-1" })
        }),
    )
}

describe("useUploadImage", () => {
    test("sends the Convex session token as a Bearer header", async () => {
        vi.mocked(getConvexSessionToken).mockResolvedValue("jwt-1")
        const captured = { auth: null as string | null, calls: 0 }
        serveUpload(captured)
        const { result } = renderHook(() => useUploadImage())

        await result.current(new File(["pixels"], "a.jpg", { type: "image/jpeg" }))

        expect(captured.calls).toBe(1)
        expect(captured.auth).toBe("Bearer jwt-1")
    })

    test("refuses to upload without a session", async () => {
        vi.mocked(getConvexSessionToken).mockResolvedValue(null)
        const captured = { auth: null as string | null, calls: 0 }
        serveUpload(captured)
        const { result } = renderHook(() => useUploadImage())

        await expect(result.current(new File(["pixels"], "a.jpg", { type: "image/jpeg" }))).rejects.toThrow(
            "Sign in to upload",
        )
        expect(captured.calls).toBe(0)
    })
})
