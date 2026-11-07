import { act, render } from "@testing-library/react"
import { useEffect } from "react"
import { describe, expect, test, vi } from "vitest"

import { type Id } from "@convex/_generated/dataModel"
import { type ImageRecord } from "@core/restaurants"

import { useRestaurantImages, type GalleryCleanup, type GalleryDraft } from "./use-restaurant-images"

let galleryRef: GalleryDraft | null = null
let cleanupMock = vi.fn<GalleryCleanup>(async () => {})

function Probe({ initial, add, cleanup }: Readonly<{ initial: ImageRecord[]; add: boolean; cleanup: GalleryCleanup }>) {
    const gallery = useRestaurantImages(initial, { mode: add ? "add" : "edit", cleanup })
    useEffect(() => {
        galleryRef = gallery
    })
    return null
}

function currentGallery(): GalleryDraft {
    if (galleryRef === null) {
        throw new TypeError("Gallery not mounted")
    }
    return galleryRef
}

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only storage id
const storageId = (value: string): Id<"_storage"> => value as unknown as Id<"_storage">

function stagedImage(id: string): ImageRecord {
    return { url: `https://example.com/${id}.jpg`, storageId: storageId(id) }
}

function renderGallery(initial: ImageRecord[], add: boolean): void {
    galleryRef = null
    cleanupMock = vi.fn<GalleryCleanup>(async () => {})
    render(<Probe initial={initial} add={add} cleanup={cleanupMock} />)
}

describe("useRestaurantImages ownership", () => {
    test("retries failed cleanups on the next discard", async () => {
        renderGallery([stagedImage("s1")], true)
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
        vi.mocked(cleanupMock).mockRejectedValueOnce(new Error("denied"))
        try {
            await act(async () => {
                await currentGallery().discardChanges()
            })
            expect(cleanupMock).toHaveBeenCalledTimes(1)
            expect(warn).toHaveBeenCalled()

            vi.mocked(cleanupMock).mockResolvedValue(undefined)
            await act(async () => {
                await currentGallery().discardChanges()
            })
            expect(cleanupMock).toHaveBeenCalledTimes(2)
            expect(cleanupMock).toHaveBeenNthCalledWith(2, { storageId: "s1" })
        } finally {
            warn.mockRestore()
        }
    })

    test("cleans session-added uploads on edit-mode discard but keeps attached", async () => {
        renderGallery([stagedImage("attached")], false)

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
        renderGallery([stagedImage("s1"), stagedImage("s2")], true)

        await act(async () => {
            currentGallery().setImages([stagedImage("s1")])
            await Promise.resolve()
        })
        await act(async () => {
            await currentGallery().discardChanges()
        })

        expect(cleanupMock).toHaveBeenCalledWith({ storageId: "s1" })
        expect(cleanupMock).toHaveBeenCalledWith({ storageId: "s2" })
    })

    test("commit transfers ownership and clears the draft", async () => {
        renderGallery([stagedImage("s1"), stagedImage("s2")], true)

        await act(async () => {
            currentGallery().setImages([stagedImage("s1")])
            await Promise.resolve()
        })
        await act(async () => {
            await currentGallery().commitSubmit()
        })

        expect(cleanupMock).toHaveBeenCalledTimes(1)
        expect(cleanupMock).toHaveBeenCalledWith({ storageId: "s2" })
        expect(currentGallery().images).toEqual([])
    })
})
