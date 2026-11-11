import { useRef, useState } from "react"

import { type Id } from "@api/data.model"
import { type ImageRecord } from "@core/restaurants"

export type GalleryCleanup = (args: { storageId: Id<"_storage"> }) => Promise<unknown>

async function cleanupStagedIds(
    storageIds: ReadonlyArray<Id<"_storage">>,
    mutate: GalleryCleanup,
    cleaned: Set<Id<"_storage">>,
): Promise<Id<"_storage">[]> {
    const failed: Id<"_storage">[] = []
    for (const storageId of storageIds) {
        if (cleaned.has(storageId)) {
            continue
        }
        try {
            await mutate({ storageId })
            cleaned.add(storageId)
        } catch (error) {
            console.warn("Failed to cleanup orphaned upload:", storageId, error)
            failed.push(storageId)
        }
    }
    return failed
}

export type GalleryDraft = {
    readonly images: ImageRecord[]
    readonly setImages: (images: ImageRecord[]) => void
    readonly discardChanges: () => Promise<void>
    readonly commitSubmit: () => Promise<void>
}

export function useRestaurantImages(options: Readonly<{ cleanup: GalleryCleanup }>): GalleryDraft {
    const { cleanup } = options
    const [images, setImagesState] = useState<ImageRecord[]>([])
    const removedRef = useRef(new Set<Id<"_storage">>())
    const cleanedRef = useRef(new Set<Id<"_storage">>())

    const discardChanges = async () => {
        const failed = await cleanupStagedIds(
            [...images.map((image) => image.storageId), ...removedRef.current],
            cleanup,
            cleanedRef.current,
        )
        const failedIds = new Set(failed)
        setImagesState(images.filter((image) => failedIds.has(image.storageId)))
        removedRef.current = new Set(failed)
    }

    const commitSubmit = async () => {
        const failed = await cleanupStagedIds([...removedRef.current], cleanup, cleanedRef.current)
        removedRef.current = new Set(failed)
        setImagesState([])
    }

    const replaceImages = (next: ImageRecord[]): void => {
        const nextIds = new Set(next.map((image) => image.storageId))
        for (const image of images) {
            if (!nextIds.has(image.storageId)) {
                removedRef.current.add(image.storageId)
            }
        }
        setImagesState([...next])
    }

    return { images, setImages: replaceImages, discardChanges, commitSubmit }
}
