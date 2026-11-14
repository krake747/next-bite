import { XIcon } from "@phosphor-icons/react"
import { useState } from "react"

import { type Id } from "@api/data.model"
import { useRemovePlacePhoto } from "@core/restaurants"
import { type GalleryPhoto } from "@pattern/gallery"
import { LazyImage } from "@pattern/lazy-image"

function useSavedPhotoRemoval(placeId: Id<"places">) {
    const removePhoto = useRemovePlacePhoto()
    const [pendingStorageId, setPendingStorageId] = useState<Id<"_storage"> | null>(null)
    const [removeError, setRemoveError] = useState<string | null>(null)

    return {
        pendingStorageId,
        removeError,
        remove: (storageId: Id<"_storage">) => {
            if (pendingStorageId !== null) {
                return
            }
            setPendingStorageId(storageId)
            setRemoveError(null)
            removePhoto.mutate(
                { placeId, storageId },
                {
                    onSuccess: () => {
                        setPendingStorageId(null)
                    },
                    onError: (error: unknown) => {
                        setPendingStorageId(null)
                        setRemoveError(error instanceof Error ? error.message : "Could not remove photo")
                    },
                },
            )
        },
    }
}

function canRemovePhoto(
    photo: GalleryPhoto,
    viewerId: Id<"profiles"> | undefined,
    ownerId: Id<"profiles"> | undefined,
): boolean {
    if (photo.storageId === undefined || viewerId === undefined) {
        return false
    }
    return (
        (ownerId !== undefined && ownerId === viewerId) || (photo.addedBy !== undefined && photo.addedBy === viewerId)
    )
}

function SavedPhotoTile({
    photo,
    index,
    restaurantName,
    disabled,
    onRemove,
}: Readonly<{
    photo: GalleryPhoto
    index: number
    restaurantName: string
    disabled: boolean
    onRemove: (photo: GalleryPhoto) => void
}>) {
    return (
        <div className="group relative aspect-square overflow-hidden rounded-lg bg-surface-muted">
            <LazyImage src={photo.url} alt={`${restaurantName} - image ${index + 1}`} ratio={1 / 1} />
            <button
                type="button"
                onClick={() => {
                    onRemove(photo)
                }}
                disabled={disabled}
                className="hit-area-2 absolute top-1 right-1 rounded-full bg-destructive p-2 text-inverse shadow-md hover:bg-destructive/90"
                aria-label={`Remove photo ${index + 1}`}
            >
                <XIcon className="size-3" aria-hidden="true" />
            </button>
        </div>
    )
}

export function SavedPhotosSection({
    placeId,
    photos,
    restaurantName,
    viewerId,
    ownerId,
}: Readonly<{
    placeId: Id<"places">
    photos: ReadonlyArray<GalleryPhoto>
    restaurantName: string
    viewerId?: Id<"profiles"> | undefined
    ownerId?: Id<"profiles"> | undefined
}>) {
    const { pendingStorageId, removeError, remove } = useSavedPhotoRemoval(placeId)

    if (photos.length === 0) {
        return null
    }

    return (
        <div className="pt-4">
            <p className="text-sm font-medium text-foreground">Current photos</p>
            <div className="grid grid-cols-3 gap-2 pt-2">
                {photos.map((photo, index) =>
                    canRemovePhoto(photo, viewerId, ownerId) && photo.storageId !== undefined ? (
                        <SavedPhotoTile
                            key={photo.storageId}
                            photo={photo}
                            index={index}
                            restaurantName={restaurantName}
                            disabled={pendingStorageId !== null}
                            onRemove={(target) => {
                                if (target.storageId !== undefined) {
                                    remove(target.storageId)
                                }
                            }}
                        />
                    ) : (
                        <div
                            key={photo.storageId ?? photo.url}
                            className="group relative aspect-square overflow-hidden rounded-lg bg-surface-muted"
                        >
                            <LazyImage src={photo.url} alt={`${restaurantName} - image ${index + 1}`} ratio={1 / 1} />
                        </div>
                    ),
                )}
            </div>
            {removeError !== null && (
                <p role="alert" className="pt-2 text-sm text-destructive">
                    {removeError}
                </p>
            )}
        </div>
    )
}
