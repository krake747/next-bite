import { useState } from "react"

import { useCleanupStorage, type ImageRecord } from "@core/hooks"

export function useRestaurantImages(mode: "add" | "edit", initialImages: ReadonlyArray<ImageRecord>) {
    const cleanupStorage = useCleanupStorage()
    const [images, setImages] = useState<ImageRecord[]>([...initialImages])
    const [pendingRemovedStorageIds, setPendingRemovedStorageIds] = useState<string[]>([])

    const cleanupStorageIds = async (storageIds: ReadonlyArray<string>) => {
        for (const storageId of storageIds) {
            try {
                await cleanupStorage.mutateAsync({ storageId })
            } catch {}
        }
    }

    const discardChanges = async () => {
        if (mode === "add") {
            await cleanupStorageIds(images.map((img) => img.storageId))
            await cleanupStorageIds(pendingRemovedStorageIds)
            setPendingRemovedStorageIds([])
        }
        setImages([])
    }

    const trackRemoved = (storageId: string) => {
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
