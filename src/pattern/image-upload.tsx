import { ImageIcon, UploadIcon, XIcon } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"

import { type Id } from "@api/data.model"
import { MAX_IMAGES } from "@core/constants"
import {
    extensionForMime,
    formatFileSize,
    isAcceptedImageType,
    processImage,
    MAX_FILE_SIZE,
    IMAGE_ACCEPT,
    IMAGE_TYPE_LABEL,
} from "@core/image.utils"
import { clearError, errorFrom, type FormError } from "@core/outcome"
import { useCleanupStorage, useDeleteImage, useUploadImage, type ImageRecord } from "@core/restaurants"
import { cx } from "@ui/cva.config"

type FileListLike = Readonly<{
    readonly length: number
    readonly [index: number]: Readonly<File>
}>

type DragStateEvent = Readonly<{
    readonly preventDefault: () => void
    readonly stopPropagation: () => void
}>

type DropEvent = Readonly<{
    readonly preventDefault: () => void
    readonly stopPropagation: () => void
    readonly dataTransfer: Readonly<{ readonly files: FileListLike | null }> | null
}>

type FileInputEvent = Readonly<{
    readonly target: Readonly<{ readonly files: FileListLike | null }>
}>

type ImageUploadProps = {
    readonly images: ReadonlyArray<Readonly<ImageRecord>>
    readonly onImagesChange: (images: ReadonlyArray<Readonly<ImageRecord>>) => void
    readonly disabled?: boolean | undefined
    readonly maxFiles?: number | undefined
    readonly restaurantId?: Id<"restaurants"> | undefined
    readonly onRemove?: ((storageId: Id<"_storage">) => void) | undefined
}

function mergeImages(
    current: ReadonlyArray<Readonly<ImageRecord>>,
    additions: ReadonlyArray<Readonly<ImageRecord>>,
): Readonly<ImageRecord>[] {
    const known = new Set(current.map((image) => image.storageId))
    const merged: Readonly<ImageRecord>[] = [...current]
    for (const image of additions) {
        if (!known.has(image.storageId)) {
            known.add(image.storageId)
            merged.push(image)
        }
    }
    return merged
}

function prepareFilesList(files: FileListLike, existingCount: number, maxFiles: number): File[] {
    const accepted = Array.from(files).filter((file) => isAcceptedImageType(file.type))
    return accepted.slice(0, Math.max(0, maxFiles - existingCount))
}

function toUploadError(error: unknown): FormError {
    return errorFrom(error, "UploadIcon failed")
}

async function processAndUpload(file: File, uploadImage: (file: File) => Promise<ImageRecord>): Promise<ImageRecord> {
    const processed = await processImage(file)
    const extension = extensionForMime(processed.blob.type)
    const baseName = file.name.replace(/\.[^.]+$/, "")
    const processedFile = new File([processed.blob], baseName + extension, { type: processed.blob.type })
    return uploadImage(processedFile)
}

export function ImageUpload(props: Readonly<ImageUploadProps>) {
    const uploadImage = useUploadImage()
    const cleanupStorage = useCleanupStorage()
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<FormError>(clearError)
    const batchRef = useRef(0)
    const mountedRef = useRef(true)
    const latestImagesRef = useRef(props.images)
    latestImagesRef.current = props.images

    // A batch is owned by the mount that started it. Closing or unmounting the
    // dialog invalidates in-flight batches. While mounted, a late completion
    // still belongs to the draft and merges into the latest gallery; after
    // unmount it is cleaned up so nothing is stranded.
    useEffect(() => {
        return () => {
            mountedRef.current = false
            batchRef.current += 1
        }
    }, [])

    const handleStaleCompletion = async (result: ImageRecord): Promise<void> => {
        if (mountedRef.current) {
            props.onImagesChange(mergeImages(latestImagesRef.current, [result]))
        } else {
            await cleanupStorage.mutateAsync({ storageId: result.storageId }).catch((error: unknown) => {
                console.warn("Failed to cleanup cancelled upload:", result.storageId, error)
            })
        }
    }

    const trackUpload = async (
        uploaded: ImageRecord,
        isCurrent: () => boolean,
        published: ImageRecord[],
    ): Promise<boolean> => {
        if (!isCurrent()) {
            await handleStaleCompletion(uploaded)
            return false
        }
        published.push(uploaded)
        props.onImagesChange(mergeImages(latestImagesRef.current, published))
        return true
    }

    const handleFiles = async (files: FileListLike) => {
        const filesToProcess = prepareFilesList(files, props.images.length, props.maxFiles ?? MAX_IMAGES)
        if (filesToProcess.length === 0) {
            return
        }

        const batch = batchRef.current + 1
        batchRef.current = batch
        const isCurrent = () => batchRef.current === batch

        setIsUploading(true)
        setUploadError(clearError)

        const published: ImageRecord[] = []
        try {
            for (const file of filesToProcess) {
                if (!isCurrent()) {
                    break
                }
                const uploaded = await processAndUpload(file, uploadImage)
                if (!(await trackUpload(uploaded, isCurrent, published))) {
                    break
                }
            }
        } catch (error) {
            if (isCurrent()) {
                setUploadError(toUploadError(error))
            }
        } finally {
            if (isCurrent()) {
                setIsUploading(false)
            }
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Images</span>
                <span className="text-xs text-muted-foreground">
                    {props.images.length}/{props.maxFiles ?? MAX_IMAGES}
                </span>
            </div>

            <ImageGrid
                images={props.images}
                onImagesChange={props.onImagesChange}
                restaurantId={props.restaurantId}
                onRemove={props.onRemove}
                disabled={props.disabled ?? false}
            />
            <UploadDropzone
                disabled={props.disabled ?? false}
                isUploading={isUploading}
                canAddMore={props.images.length < (props.maxFiles ?? MAX_IMAGES)}
                onFiles={(files) => {
                    void handleFiles(files)
                }}
            />

            {isUploading && <p className="text-center text-sm text-muted-foreground">Uploading…</p>}

            {uploadError.kind === "error" && <p className="text-sm text-destructive">{uploadError.message}</p>}
        </div>
    )
}

function ImageGrid({
    images,
    onImagesChange,
    restaurantId,
    onRemove,
    disabled,
}: Readonly<{
    images: ReadonlyArray<Readonly<ImageRecord>>
    onImagesChange: (images: ReadonlyArray<Readonly<ImageRecord>>) => void
    restaurantId: Id<"restaurants"> | undefined
    onRemove: ((storageId: Id<"_storage">) => void) | undefined
    disabled: boolean
}>) {
    const deleteImage = useDeleteImage()

    const handleRemove = async (index: number, image: Readonly<ImageRecord>) => {
        const originalImages = [...images]
        onImagesChange(images.filter((_, i) => i !== index))

        if (restaurantId !== undefined) {
            try {
                await deleteImage.mutateAsync({
                    restaurantId,
                    imageUrl: image.url,
                    storageId: image.storageId,
                })
            } catch (error) {
                onImagesChange(originalImages)
                console.error("Failed to delete image:", error)
            }
            return
        }
        onRemove?.(image.storageId)
    }

    if (images.length === 0) {
        return null
    }
    return (
        <div data-slot="image-preview-list" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((image, index) => (
                <ImagePreview
                    key={image.storageId}
                    imageUrl={image.url}
                    onRemove={() => {
                        void handleRemove(index, image)
                    }}
                    disabled={disabled}
                />
            ))}
        </div>
    )
}

function UploadDropzone({
    disabled,
    isUploading,
    canAddMore,
    onFiles,
}: Readonly<{
    disabled: boolean
    isUploading: boolean
    canAddMore: boolean
    onFiles: (files: FileListLike) => void
}>) {
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    if (!canAddMore || disabled) {
        return null
    }

    const handleDragEnter = (event: DragStateEvent) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (event: DragStateEvent) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDragging(false)
    }

    const handleDragOver = (event: DragStateEvent) => {
        event.preventDefault()
        event.stopPropagation()
    }

    const handleDrop = (event: DropEvent) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDragging(false)
        const droppedFiles = event.dataTransfer?.files
        if (droppedFiles !== undefined && droppedFiles !== null && droppedFiles.length > 0) {
            onFiles(droppedFiles)
        }
    }

    const handleClick = () => {
        if (isUploading) {
            return
        }
        fileInputRef.current?.click()
    }

    const handleFileInputChange = (event: FileInputEvent) => {
        if (event.target.files !== null) {
            onFiles(event.target.files)
            if (fileInputRef.current !== null) {
                fileInputRef.current.value = ""
            }
        }
    }

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={IMAGE_ACCEPT}
                data-slot="image-upload-input"
                className="hidden"
                onChange={handleFileInputChange}
            />
            <button
                type="button"
                onClick={handleClick}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={cx(
                    "flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
                    isDragging ? "border-primary bg-primary/10" : "border-border hover:border-border-strong",
                    isUploading && "pointer-events-none opacity-50",
                )}
            >
                {isDragging ? (
                    <UploadIcon className="mb-2 size-8 text-primary" />
                ) : (
                    <ImageIcon className="mb-2 size-8 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                    {isDragging ? "Drop images here" : "Click or drag & drop to upload images"}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                    {IMAGE_TYPE_LABEL} up to {formatFileSize(MAX_FILE_SIZE)}
                </span>
            </button>
        </>
    )
}

function ImagePreview({
    imageUrl,
    onRemove,
    disabled,
}: Readonly<{
    imageUrl: string
    onRemove: () => void
    disabled: boolean
}>) {
    return (
        <div className="group relative aspect-square overflow-hidden rounded-lg bg-surface-muted">
            <img
                src={imageUrl}
                alt={`Uploaded image preview`}
                className="size-full object-cover"
                loading="lazy"
                decoding="async"
            />

            {!disabled && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="hit-area-2 absolute top-1 right-1 rounded-full bg-destructive p-2 text-inverse opacity-0 shadow-md transition-opacity duration-150 ease group-hover:opacity-100 hover:bg-destructive/90 focus:opacity-100 focus-visible:opacity-100 active:opacity-100 pointer-coarse:opacity-100"
                    aria-label="Remove image"
                >
                    <XIcon className="size-3" aria-hidden="true" />
                </button>
            )}
        </div>
    )
}
