import { act, render } from "@testing-library/react"
import { useEffect } from "react"
import { describe, expect, test, vi } from "vitest"

import { type Id } from "@api/data.model"
import { type ImageRecord } from "@core/schemas"

import { useRestaurantPhotos, type RestaurantPhotoCleanup, type RestaurantPhotoDraft } from "./use-restaurant-photos"

let galleryRef: RestaurantPhotoDraft | null = null
let cleanupMock = vi.fn<RestaurantPhotoCleanup>(async () => {})

function Probe({ cleanup }: Readonly<{ cleanup: RestaurantPhotoCleanup }>) {
    const gallery = useRestaurantPhotos({ cleanup })
    useEffect(() => {
        galleryRef = gallery
    })
    return null
}

function currentGallery(): RestaurantPhotoDraft {
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

function renderGallery(): void {
    galleryRef = null
    cleanupMock = vi.fn<RestaurantPhotoCleanup>(async () => {})
    render(<Probe cleanup={cleanupMock} />)
}

describe("useRestaurantPhotos ownership", () => {
    test("commit transfers ownership and clears the draft", async () => {
        renderGallery()
        await act(async () => {
            currentGallery().setImages([stagedImage("s1"), stagedImage("s2")])
            await Promise.resolve()
        })
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
