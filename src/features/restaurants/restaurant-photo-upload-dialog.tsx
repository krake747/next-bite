import { XIcon } from "@phosphor-icons/react"
import { useState } from "react"

import { type Id } from "@api/data.model"
import { type RestaurantPhotoInput } from "@api/db/restaurants"
import { MAX_IMAGES } from "@core/constants"
import { clearError, errorFrom, type FormError } from "@core/outcome"
import { useAddRestaurantPhotos, useDeleteUpload, useRemoveRestaurantPhoto, useUploadImage } from "@core/restaurants"
import { type Restaurant } from "@core/restaurants"
import { type ImageRecord } from "@core/schemas"
import { type GalleryPhoto } from "@pattern/gallery"
import { ImageUpload } from "@pattern/image-upload"
import { LazyImage } from "@pattern/lazy-image"
import { Button } from "@ui/button"
import { Dialog, DialogContent, DialogTitle } from "@ui/dialog"

import { useRestaurantImages } from "./use-restaurant-images"

function toPhotoInput(image: ImageRecord): RestaurantPhotoInput {
    return {
        storageId: image.storageId,
        ...(image.width !== undefined ? { width: image.width } : {}),
        ...(image.height !== undefined ? { height: image.height } : {}),
    }
}

function usePhotoUploadSubmit({
    restaurantId,
    gallery,
    onOpenChange,
}: Readonly<{
    restaurantId: Id<"places">
    gallery: ReturnType<typeof useRestaurantImages>
    onOpenChange: (open: boolean) => void
}>) {
    const addPhotos = useAddRestaurantPhotos()
    const [error, setError] = useState<FormError>(clearError)

    const handleSubmit = async () => {
        if (gallery.images.length === 0 || addPhotos.isPending) {
            return
        }
        setError(clearError)
        try {
            await addPhotos.mutateAsync({ placeId: restaurantId, photos: gallery.images.map(toPhotoInput) })
            await gallery.commitSubmit()
            onOpenChange(false)
        } catch (err) {
            setError(errorFrom(err, "Could not add your photos"))
        }
    }

    return { error, handleSubmit, isPending: addPhotos.isPending, count: gallery.images.length }
}

function PhotoUploadActions({
    onCancel,
    onSubmit,
    canSubmit,
    isPending,
    count,
}: Readonly<{
    onCancel: () => void
    onSubmit: () => void
    canSubmit: boolean
    isPending: boolean
    count: number
}>) {
    return (
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" tone="secondary" onClick={onCancel}>
                Cancel
            </Button>
            <Button type="button" disabled={!canSubmit || isPending} onClick={onSubmit}>
                {isPending ? "Adding…" : `Add ${count === 0 ? "photos" : `${count} photo${count === 1 ? "" : "s"}`}`}
            </Button>
        </div>
    )
}

function useSavedPhotoRemoval(restaurantId: Id<"places">) {
    const removePhoto = useRemoveRestaurantPhoto()
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
                { placeId: restaurantId, storageId },
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

export function RestaurantPhotoUploadDialog({
    restaurant,
    viewerId,
    show,
    onOpenChange,
}: Readonly<{
    restaurant: Restaurant
    viewerId?: Id<"profiles"> | undefined
    show: boolean
    onOpenChange: (open: boolean) => void
}>) {
    const placeId = restaurant._id
    const existingPhotos = restaurant.photos
    const remaining = MAX_IMAGES - existingPhotos.length
    const uploadImage = useUploadImage()
    const deleteUpload = useDeleteUpload()
    const gallery = useRestaurantImages({
        cleanup: async (args) => {
            await deleteUpload.mutateAsync(args)
        },
    })
    const submit = usePhotoUploadSubmit({ restaurantId: placeId, gallery, onOpenChange })
    const removal = useSavedPhotoRemoval(placeId)

    const handleOpenChange = (open: boolean): void => {
        if (!open && !submit.isPending) {
            void gallery.discardChanges()
        }
        onOpenChange(open)
    }

    const handleImagesChange = (updated: ReadonlyArray<ImageRecord>): void => {
        gallery.setImages([...updated])
    }

    const handleRemovePhoto = (target: GalleryPhoto): void => {
        if (target.storageId !== undefined) {
            removal.remove(target.storageId)
        }
    }

    return (
        <Dialog open={show} onOpenChange={handleOpenChange}>
            <DialogContent size="sm" padding="sm">
                <DialogTitle className="mb-1">Add photos</DialogTitle>
                <p className="mb-4 text-sm text-muted-foreground">
                    {restaurant.name} · {remaining} {remaining === 1 ? "slot" : "slots"} left
                </p>
                <ImageUpload
                    images={gallery.images}
                    onImagesChange={handleImagesChange}
                    uploadImage={uploadImage}
                    deleteUpload={async (args) => deleteUpload.mutateAsync(args)}
                    maxFiles={remaining}
                />
                {existingPhotos.length > 0 && (
                    <div className="pt-4">
                        <p className="text-sm font-medium text-foreground">Current photos</p>
                        <div className="grid grid-cols-3 gap-2 pt-2">
                            {existingPhotos.map((photo, index) =>
                                canRemovePhoto(photo, viewerId, restaurant.ownerId) && photo.storageId !== undefined ? (
                                    <SavedPhotoTile
                                        key={photo.storageId}
                                        photo={photo}
                                        index={index}
                                        restaurantName={restaurant.name}
                                        disabled={removal.pendingStorageId !== null}
                                        onRemove={handleRemovePhoto}
                                    />
                                ) : (
                                    <div
                                        key={photo.storageId ?? photo.url}
                                        className="group relative aspect-square overflow-hidden rounded-lg bg-surface-muted"
                                    >
                                        <LazyImage
                                            src={photo.url}
                                            alt={`${restaurant.name} - image ${index + 1}`}
                                            ratio={1 / 1}
                                        />
                                    </div>
                                ),
                            )}
                        </div>
                        {removal.removeError !== null && (
                            <p role="alert" className="pt-2 text-sm text-destructive">
                                {removal.removeError}
                            </p>
                        )}
                    </div>
                )}
                {submit.error.kind === "error" && (
                    <p role="alert" className="pt-2 text-sm text-destructive">
                        {submit.error.message}
                    </p>
                )}
                <PhotoUploadActions
                    onCancel={() => {
                        handleOpenChange(false)
                    }}
                    onSubmit={() => {
                        void submit.handleSubmit()
                    }}
                    canSubmit={gallery.images.length > 0}
                    isPending={submit.isPending}
                    count={submit.count}
                />
            </DialogContent>
        </Dialog>
    )
}
