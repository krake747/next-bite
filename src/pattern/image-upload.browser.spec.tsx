import { QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"
import { page } from "vitest/browser"

import { ConvexProvider } from "@api/convex.client"
import { createSeededClient, type MutationCall } from "@api/db/seeded.client"
import { type Id } from "@convex/_generated/dataModel"
import { type ImageRecord } from "@core/restaurants"
import { ImageUpload } from "@pattern/image-upload"

type Deferred<T> = {
    readonly promise: Promise<T>
    readonly resolve: (value: T) => void
    readonly reject: (error: Error) => void
}

function createDeferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void
    let reject!: (error: Error) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only storage id
const storageId = (value: string): Id<"_storage"> => value as unknown as Id<"_storage">

let uploadCalls = 0
const uploadGates: Deferred<ImageRecord>[] = []
let uploadImpl: (file: Readonly<File>) => Promise<ImageRecord> = async () => {
    await Promise.resolve()
    throw new Error("uploadImpl not set")
}

vi.mock("@api/auth.client", () => ({
    getConvexSessionToken: async () => {
        await Promise.resolve()
        return "test-token"
    },
}))

vi.mock("@core/image.utils", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/image.utils")>()
    return {
        ...original,
        processImage: async (file: Readonly<File>) => {
            await Promise.resolve()
            return {
                blob: file,
                originalName: file.name,
                originalSize: file.size,
                processedSize: file.size,
                width: 1,
                height: 1,
            }
        },
    }
})

vi.mock("@core/restaurants", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/restaurants")>()
    return {
        ...original,
        useUploadImage: () => uploadImpl,
    }
})

const mutationCalls: MutationCall[] = []

function Harness() {
    const [images, setImages] = useState<ImageRecord[]>([])
    return (
        <ImageUpload
            images={images}
            onImagesChange={(updated) => {
                setImages([...updated])
            }}
        />
    )
}

async function renderHarness() {
    const backend = createSeededClient({ calls: mutationCalls })
    return render(
        <QueryClientProvider client={backend.queryClient}>
            <ConvexProvider client={backend.client}>
                <Harness />
            </ConvexProvider>
        </QueryClientProvider>,
    )
}

async function selectFiles(files: File[]): Promise<void> {
    const input = document.querySelector('[data-slot="image-upload-input"]')
    if (!(input instanceof HTMLInputElement)) {
        throw new TypeError("File input not found")
    }
    await page.elementLocator(input).upload(files)
}

function stagedImageCount(): number {
    return document.querySelector('[data-slot="image-preview-list"]')?.childElementCount ?? 0
}

function pngFile(name: string): File {
    return new File(["pixels"], name, { type: "image/png" })
}

function resetUploads(): void {
    uploadCalls = 0
    uploadGates.length = 0
    mutationCalls.length = 0
    uploadImpl = async () => {
        await Promise.resolve()
        const gate = createDeferred<ImageRecord>()
        uploadGates.push(gate)
        uploadCalls += 1
        return gate.promise
    }
}

describe("ImageUpload batch ownership", () => {
    test("keeps the first upload when the second fails", async () => {
        resetUploads()
        const screen = await renderHarness()
        await selectFiles([pngFile("a.png"), pngFile("b.png")])

        const firstGate = await vi.waitUntil(() => uploadGates[0], { message: "Upload never started" })
        firstGate.resolve({ url: "https://example.com/a.jpg", storageId: storageId("s1") })

        await expect.poll(() => stagedImageCount()).toBe(1)
        expect(uploadCalls).toBe(2)
        const secondGate = await vi.waitUntil(() => uploadGates[1], { message: "Upload never started" })
        secondGate.reject(new Error("denied"))

        await expect.element(screen.getByText("denied")).toBeInTheDocument()
        expect(stagedImageCount()).toBe(1)
    })

    test("cleans up a late upload after unmount instead of appending it", async () => {
        resetUploads()
        const screen = await renderHarness()
        await selectFiles([pngFile("a.png")])

        await expect.poll(() => uploadCalls).toBe(1)
        await screen.unmount()

        const gate = await vi.waitUntil(() => uploadGates[0], { message: "Upload never started" })
        gate.resolve({ url: "https://example.com/a.jpg", storageId: storageId("s1") })

        await expect
            .poll(() => mutationCalls)
            .toContainEqual({
                fn: "restaurants:cleanupStorage",
                args: { storageId: "s1" },
            })

        const fresh = await renderHarness()
        await expect.element(fresh.getByRole("button", { name: /upload images/i })).toBeInTheDocument()
        expect(stagedImageCount()).toBe(0)
    })

    test("merges a superseded batch into the gallery while mounted", async () => {
        resetUploads()
        await renderHarness()
        await selectFiles([pngFile("a.png")])

        await expect.poll(() => uploadCalls).toBe(1)
        await selectFiles([pngFile("b.png")])

        await expect.poll(() => uploadCalls).toBe(2)
        const firstGate = await vi.waitUntil(() => uploadGates[0], { message: "Upload never started" })
        firstGate.resolve({ url: "https://example.com/a.jpg", storageId: storageId("s1") })

        await expect.poll(() => stagedImageCount()).toBe(1)
        expect(mutationCalls.filter((call) => call.fn === "restaurants:cleanupStorage")).toHaveLength(0)

        const secondGate = await vi.waitUntil(() => uploadGates[1], { message: "Upload never started" })
        secondGate.resolve({ url: "https://example.com/b.jpg", storageId: storageId("s2") })

        await expect.poll(() => stagedImageCount()).toBe(2)
    })
})
