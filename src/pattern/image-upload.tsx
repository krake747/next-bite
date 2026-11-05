import ImagePlus from "lucide-react/icons/image-plus"
import Upload from "lucide-react/icons/upload"
import X from "lucide-react/icons/x"
import { useState, useRef } from "react"

import { type Id } from "@convex/_generated/dataModel"
import { useUploadImage, useDeleteImage, type ImageRecord } from "@core/hooks"
import { processImage, formatFileSize, MAX_IMAGES, MAX_FILE_SIZE } from "@core/image-utils"
import { cx } from "@ui/variants"

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
    readonly dataTransfer: Readonly<{ readonly files: FileListLike }> | null
}>

type FileInputEvent = Readonly<{
    readonly target: Readonly<{ readonly files: FileListLike | null }>
}>

type ImageUploadProps = {
    readonly images: ReadonlyArray<Readonly<ImageRecord>>
    readonly onImagesChange: (images: ReadonlyArray<Readonly<ImageRecord>>) => void
    readonly maxImages?: number | undefined
    readonly disabled?: boolean | undefined
    readonly restaurantId?: Id<"restaurants"> | undefined
    readonly onRemove?: ((storageId: string) => void) | undefined
}

export function ImageUpload(props: Readonly<ImageUploadProps>) {
    const maxImages = props.maxImages ?? MAX_IMAGES
    const uploadImage = useUploadImage()
    const deleteImage = useDeleteImage()
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFiles = async (files: FileListLike) => {
        const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"))
        const remainingSlots = maxImages - props.images.length
        const filesToProcess = fileArray.slice(0, remainingSlots)
        if (filesToProcess.length === 0) {
            return
        }

        setIsUploading(true)
        setUploadError(null)

        const newImages: ImageRecord[] = []

        try {
            for (const file of filesToProcess) {
                if (file.size > MAX_FILE_SIZE) {
                    throw new Error(`${file.name} is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`)
                }

                const processed = await processImage(file, { maxWidth: 1920, quality: 0.9 })
                const extension =
                    processed.blob.type === "image/webp"
                        ? ".webp"
                        : processed.blob.type === "image/png"
                          ? ".png"
                          : processed.blob.type === "image/gif"
                            ? ".gif"
                            : ".jpg"
                const baseName = file.name.replace(/\.[^.]+$/, "")
                const processedFileName = baseName + extension
                const processedFile = new File([processed.blob], processedFileName, { type: processed.blob.type })
                const result = await uploadImage(processedFile)
                newImages.push({ url: result.url, storageId: result.storageId })
            }

            props.onImagesChange([...props.images, ...newImages])
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : "Upload failed")
        } finally {
            setIsUploading(false)
        }
    }

    const handleDragEnter = (e: DragStateEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: DragStateEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDragOver = (e: DragStateEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: DropEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        const droppedFiles = e.dataTransfer?.files
        if (droppedFiles !== undefined && droppedFiles !== null && droppedFiles.length > 0) {
            void handleFiles(droppedFiles)
        }
    }

    const handleClick = () => {
        if (props.disabled === true) {
            return
        }
        fileInputRef.current?.click()
    }

    const handleFileInputChange = (e: FileInputEvent) => {
        if (e.target.files !== null) {
            void handleFiles(e.target.files)
            if (fileInputRef.current !== null) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleRemove = async (index: number, image: Readonly<ImageRecord>) => {
        const originalImages = [...props.images]
        props.onImagesChange(props.images.filter((_, i) => i !== index))

        if (props.restaurantId !== undefined) {
            try {
                await deleteImage.mutateAsync({
                    restaurantId: props.restaurantId,
                    imageUrl: image.url,
                    storageId: image.storageId,
                })
            } catch (err) {
                props.onImagesChange(originalImages)
                console.error("Failed to delete image:", err)
            }
        } else {
            props.onRemove?.(image.storageId)
        }
    }

    const canAddMore = props.images.length < maxImages

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-stone-700">Images</label>
                <span className="text-xs text-stone-600">
                    {props.images.length}/{maxImages}
                </span>
            </div>

            {props.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {props.images.map((image, index) => (
                        <ImagePreview
                            key={image.storageId}
                            imageUrl={image.url}
                            index={index}
                            onRemove={() => {
                                void handleRemove(index, image)
                            }}
                            disabled={props.disabled ?? false}
                        />
                    ))}
                </div>
            )}

            {canAddMore && props.disabled !== true && (
                <>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleFileInputChange}
                    />
                    <div
                        onClick={handleClick}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={cx(
                            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all",
                            isDragging
                                ? "border-tomato-500 bg-tomato-50"
                                : "border-stone-300 hover:border-stone-400 hover:bg-stone-50",
                            isUploading && "pointer-events-none opacity-50",
                        )}
                    >
                        {isDragging ? (
                            <Upload className="mb-2 size-8 text-tomato-500" />
                        ) : (
                            <ImagePlus className="mb-2 size-8 text-stone-400" />
                        )}
                        <span className="text-sm text-stone-600">
                            {isDragging ? "Drop images here" : "Click or drag & drop to upload images"}
                        </span>
                        <span className="mt-1 text-xs text-stone-600">
                            JPEG, PNG, WebP, GIF up to {formatFileSize(MAX_FILE_SIZE)}
                        </span>
                    </div>
                </>
            )}

            {isUploading && <p className="text-center text-sm text-stone-600">Uploading…</p>}

            {uploadError !== null && uploadError !== "" && <p className="text-sm text-destructive">{uploadError}</p>}
        </div>
    )
}

function ImagePreview({
    imageUrl,
    index,
    onRemove,
    disabled,
}: Readonly<{
    imageUrl: string
    index: number
    onRemove: () => void
    disabled: boolean
}>) {
    return (
        <div className="group relative aspect-square overflow-hidden rounded-lg bg-stone-100">
            <img src={imageUrl} alt={`Image ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />

            {!disabled && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-white opacity-0 shadow-md transition-opacity duration-150 ease group-hover:opacity-100 hover:bg-destructive/90 focus:opacity-100 focus-visible:opacity-100 active:opacity-100 pointer-coarse:opacity-100"
                    aria-label="Remove image"
                >
                    <X className="size-3" />
                </button>
            )}
        </div>
    )
}
