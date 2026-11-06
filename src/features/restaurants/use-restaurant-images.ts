import { useRef, useState } from "react"

import { type Id } from "@convex/_generated/dataModel"
import { useCleanupStorage, type ImageRecord } from "@core/hooks"

async function cleanupUnownedIds(
    storageIds: ReadonlyArray<Id<"_storage">>,
    mutate: (args: { storageId: Id<"_storage"> }) => Promise<unknown>,
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

export function useRestaurantImages(
    initialImages: ReadonlyArray<ImageRecord>,
    options: Readonly<{ discardShouldCleanup: boolean }>,
) {
    const cleanupStorage = useCleanupStorage()
    const [images, setImages] = useState<ImageRecord[]>([...initialImages])
    const [pendingRemovedStorageIds, setPendingRemovedStorageIds] = useState<Id<"_storage">[]>([])
    const cleanedRef = useRef(new Set<Id<"_storage">>())
    const initialIdsRef = useRef<Set<Id<"_storage">> | null>(null)
    initialIdsRef.current ??= new Set(initialImages.map((image) => image.storageId))

    const cleanupStorageIds = async (storageIds: ReadonlyArray<Id<"_storage">>): Promise<Id<"_storage">[]> => {
        return cleanupUnownedIds(
            storageIds,
            async (args) => {
                await cleanupStorage.mutateAsync(args)
            },
            cleanedRef.current,
        )
    }

    const discardChanges = async () => {
        if (options.discardShouldCleanup) {
            // Only cleaned ids leave the draft: failed cleanups stay tracked so
            // the next discard retries them instead of abandoning them silently.
            const failed = await cleanupStorageIds([...images.map((img) => img.storageId), ...pendingRemovedStorageIds])
            const failedIds = new Set(failed)
            setImages(images.filter((image) => failedIds.has(image.storageId)))
            setPendingRemovedStorageIds(pendingRemovedStorageIds.filter((id) => failedIds.has(id)))
        } else {
            // Edit mode never deletes attached files. Session-added uploads that
            // were never saved are still owned by this draft, so clean those.
            const initialIds = initialIdsRef.current ?? new Set<Id<"_storage">>()
            const sessionAdded = images.map((image) => image.storageId).filter((id) => !initialIds.has(id))
            const failed = await cleanupStorageIds(sessionAdded)
            const failedIds = new Set(failed)
            setImages(images.filter((image) => failedIds.has(image.storageId)))
        }
    }

    const trackRemoved = (storageId: Id<"_storage">) => {
        setPendingRemovedStorageIds((prev) => [...prev, storageId])
    }

    const completeAddSubmit = async () => {
        const failed = await cleanupStorageIds(pendingRemovedStorageIds)
        const failedIds = new Set(failed)
        setPendingRemovedStorageIds(pendingRemovedStorageIds.filter((id) => failedIds.has(id)))
    }

    const resetImages = () => {
        setImages([])
    }

    return { images, setImages, trackRemoved, discardChanges, completeAddSubmit, resetImages }
}
