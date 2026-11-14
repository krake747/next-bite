import { useState } from "react"

import { type Id } from "@api/data.model"
import { type PlacePhotoInput } from "@api/db/restaurants"
import { clearError, errorFrom, type FormError } from "@core/outcome"
import { useAddPlacePhotos, useDeleteUpload, useUploadImage } from "@core/restaurants"
import { type ImageRecord } from "@core/schemas"
import { type GalleryPhoto } from "@pattern/gallery"
import { ImageUpload } from "@pattern/image-upload"
import { Button } from "@ui/button"
import { Dialog, DialogContent, DialogTitle } from "@ui/dialog"

import { SavedPhotosSection } from "./place-saved-photos"
import { useRestaurantImages } from "./use-restaurant-images"

function toPhotoInput(image: ImageRecord): PlacePhotoInput {
    return {
        storageId: image.storageId,
        ...(image.width !== undefined ? { width: image.width } : {}),
        ...(image.height !== undefined ? { height: image.height } : {}),
    }
}

const EMPTY_PHOTOS: ReadonlyArray<GalleryPhoto> = []

function usePhotoUploadSubmit({
    placeId,
    gallery,
    onOpenChange,
}: Readonly<{
    placeId: Id<"places">
    gallery: ReturnType<typeof useRestaurantImages>
    onOpenChange: (open: boolean) => void
}>) {
    const addPhotos = useAddPlacePhotos()
    const [error, setError] = useState<FormError>(clearError)

    const handleSubmit = async () => {
        if (gallery.images.length === 0 || addPhotos.isPending) {
            return
        }
        setError(clearError)
        try {
            await addPhotos.mutateAsync({ placeId, photos: gallery.images.map(toPhotoInput) })
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

export function PlacePhotoUploadDialog({
    placeId,
    show,
    onOpenChange,
    remaining,
    restaurantName,
    existingPhotos,
    viewerId,
    ownerId,
}: Readonly<{
    placeId: Id<"places">
    show: boolean
    onOpenChange: (open: boolean) => void
    remaining: number
    restaurantName: string
    existingPhotos?: ReadonlyArray<GalleryPhoto> | undefined
    viewerId?: Id<"profiles"> | undefined
    ownerId?: Id<"profiles"> | undefined
}>) {
    const uploadImage = useUploadImage()
    const deleteUpload = useDeleteUpload()
    const gallery = useRestaurantImages({
        cleanup: async (args) => {
            await deleteUpload.mutateAsync(args)
        },
    })
    const submit = usePhotoUploadSubmit({ placeId, gallery, onOpenChange })

    const handleOpenChange = (open: boolean) => {
        if (!open && !submit.isPending) {
            void gallery.discardChanges()
        }
        onOpenChange(open)
    }

    return (
        <Dialog open={show} onOpenChange={handleOpenChange}>
            <DialogContent size="sm" padding="sm">
                <DialogTitle className="mb-1">Add photos</DialogTitle>
                <p className="mb-4 text-sm text-muted-foreground">
                    {restaurantName} · {remaining} {remaining === 1 ? "slot" : "slots"} left
                </p>
                <ImageUpload
                    images={gallery.images}
                    onImagesChange={(updated) => {
                        gallery.setImages([...updated])
                    }}
                    uploadImage={uploadImage}
                    deleteUpload={async (args) => deleteUpload.mutateAsync(args)}
                    maxFiles={remaining}
                />
                <SavedPhotosSection
                    placeId={placeId}
                    photos={existingPhotos ?? EMPTY_PHOTOS}
                    restaurantName={restaurantName}
                    viewerId={viewerId}
                    ownerId={ownerId}
                />
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
