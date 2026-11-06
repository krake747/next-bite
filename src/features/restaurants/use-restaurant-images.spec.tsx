import { act, render } from "@testing-library/react"
import { useEffect } from "react"
import { describe, expect, test, vi } from "vitest"

import { type Id } from "@convex/_generated/dataModel"
import { type ImageRecord } from "@core/hooks"

import { useRestaurantImages } from "./use-restaurant-images"

type Gallery = ReturnType<typeof useRestaurantImages>

let galleryRef: Gallery | null = null
const cleanupMock = vi.fn<() => Promise<unknown>>()

vi.mock("@core/hooks", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/hooks")>()
    return {
        ...original,
        useCleanupStorage: () => ({ mutateAsync: cleanupMock }),
    }
})

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only storage id
const storageId = (value: string): Id<"_storage"> => value as unknown as Id<"_storage">

function stagedImage(id: string): ImageRecord {
    return { url: `https://example.com/${id}.jpg`, storageId: storageId(id) }
}

function Probe({ initial, add }: Readonly<{ initial: ImageRecord[]; add: boolean }>) {
    const gallery = useRestaurantImages(initial, { discardShouldCleanup: add })
    useEffect(() => {
        galleryRef = gallery
    })
    return null
}

function currentGallery(): Gallery {
    if (galleryRef === null) {
        throw new TypeError("Gallery not mounted")
    }
    return galleryRef
}

function resetGallery(): void {
    galleryRef = null
    cleanupMock.mockReset()
    cleanupMock.mockResolvedValue(undefined)
    vi.restoreAllMocks()
}

describe("useRestaurantImages ownership", () => {
    test("retries failed cleanups on the next discard", async () => {
        resetGallery()
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
        cleanupMock.mockRejectedValueOnce(new Error("denied"))
        render(<Probe initial={[stagedImage("s1")]} add />)

        await act(async () => {
            await currentGallery().discardChanges()
        })
        expect(cleanupMock).toHaveBeenCalledTimes(1)
        expect(warn).toHaveBeenCalledWith("Failed to cleanup orphaned upload:", "s1", expect.any(Error))

        cleanupMock.mockResolvedValue(undefined)
        await act(async () => {
            await currentGallery().discardChanges()
        })
        expect(cleanupMock).toHaveBeenCalledTimes(2)
        expect(cleanupMock).toHaveBeenNthCalledWith(2, { storageId: "s1" })
    })

    test("cleans session-added uploads on edit-mode discard but keeps attached", async () => {
        resetGallery()
        render(<Probe initial={[stagedImage("attached")]} add={false} />)

        await act(async () => {
            const gallery = currentGallery()
            gallery.setImages([stagedImage("attached"), stagedImage("s9")])
            await Promise.resolve()
        })
        await act(async () => {
            await currentGallery().discardChanges()
        })

        expect(cleanupMock).toHaveBeenCalledTimes(1)
        expect(cleanupMock).toHaveBeenCalledWith({ storageId: "s9" })
    })

    test("cleans removed and staged ids on explicit discard", async () => {
        resetGallery()
        render(<Probe initial={[stagedImage("s1")]} add />)

        await act(async () => {
            currentGallery().trackRemoved(storageId("s2"))
            await Promise.resolve()
        })
        await act(async () => {
            await currentGallery().discardChanges()
        })

        expect(cleanupMock).toHaveBeenCalledWith({ storageId: "s1" })
        expect(cleanupMock).toHaveBeenCalledWith({ storageId: "s2" })
    })
})
