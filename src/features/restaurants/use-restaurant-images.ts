import { useState } from "react"

import { type Id } from "@convex/_generated/dataModel"
import { useCleanupStorage, type ImageRecord } from "@core/hooks"

export function useRestaurantImages(
    initialImages: ReadonlyArray<ImageRecord>,
    options: Readonly<{ discardShouldCleanup: boolean }>,
) {
    const cleanupStorage = useCleanupStorage()
    const [images, setImages] = useState<ImageRecord[]>([...initialImages])
    const [pendingRemovedStorageIds, setPendingRemovedStorageIds] = useState<Id<"_storage">[]>([])

    const cleanupStorageIds = async (storageIds: ReadonlyArray<Id<"_storage">>) => {
        for (const storageId of storageIds) {
            try {
                await cleanupStorage.mutateAsync({ storageId })
            } catch (error) {
                console.warn("Failed to cleanup orphaned upload:", storageId, error)
            }
        }
    }

    const discardChanges = async () => {
        if (options.discardShouldCleanup) {
            await cleanupStorageIds(images.map((img) => img.storageId))
            await cleanupStorageIds(pendingRemovedStorageIds)
            setPendingRemovedStorageIds([])
        }
        setImages([])
    }

    const trackRemoved = (storageId: Id<"_storage">) => {
        setPendingRemovedStorageIds((prev) => [...prev, storageId])
    }

    const completeAddSubmit = async () => {
        await cleanupStorageIds(pendingRemovedStorageIds)
        setPendingRemovedStorageIds([])
    }

    const resetImages = () => {
        setImages([])
    }

    return { images, setImages, trackRemoved, discardChanges, completeAddSubmit, resetImages }
}
