import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "./constants"

export const MAX_FILE_SIZE = MAX_UPLOAD_BYTES

const FULL_SIZE_WIDTH = 1920

const VALID_IMAGE_TYPES = [...ALLOWED_IMAGE_TYPES]

export const IMAGE_ACCEPT = VALID_IMAGE_TYPES.join(",")

export const IMAGE_TYPE_LABEL = VALID_IMAGE_TYPES.map((type) =>
    type === "image/webp" ? "WebP" : type.replace("image/", "").toUpperCase(),
).join(", ")

export function isAcceptedImageType(mimeType: string): boolean {
    return VALID_IMAGE_TYPES.includes(mimeType)
}

export function extensionForMime(mimeType: string): string {
    switch (mimeType) {
        case "image/webp":
            return ".webp"
        case "image/png":
            return ".png"
        case "image/gif":
            return ".gif"
        default:
            return ".jpg"
    }
}

const IMAGE_PROCESS_DEFAULTS = { maxWidth: FULL_SIZE_WIDTH, quality: 0.9 } as const

type ProcessedImage = {
    blob: Blob
    originalName: string
    originalSize: number
    processedSize: number
    width: number
    height: number
}

export function validateImageFile(file: Readonly<File>): void {
    if (!isAcceptedImageType(file.type)) {
        throw new Error(`Invalid file type. Must be one of: ${IMAGE_TYPE_LABEL}`)
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }
}

export async function processImage(file: Readonly<File>): Promise<ProcessedImage> {
    validateImageFile(file)

    const maxWidth = IMAGE_PROCESS_DEFAULTS.maxWidth
    const quality = IMAGE_PROCESS_DEFAULTS.quality

    if (file.type === "image/gif") {
        return {
            blob: file,
            originalName: file.name,
            originalSize: file.size,
            processedSize: file.size,
            width: 0,
            height: 0,
        }
    }

    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(url)

            const { width, height } = calculateDimensions(img.width, img.height, maxWidth)

            const canvas = document.createElement("canvas")
            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext("2d")
            if (!ctx) {
                reject(new Error("Failed to get canvas context"))
                return
            }

            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
                (blob: Readonly<Blob> | null) => {
                    if (blob === null) {
                        reject(new Error("Failed to create blob"))
                        return
                    }

                    resolve({
                        blob,
                        originalName: file.name,
                        originalSize: file.size,
                        processedSize: blob.size,
                        width,
                        height,
                    })
                },
                "image/webp",
                quality,
            )
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error("Failed to load image"))
        }

        img.src = url
    })
}

function calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
): { width: number; height: number } {
    if (originalWidth <= maxWidth) {
        return { width: originalWidth, height: originalHeight }
    }

    const ratio = maxWidth / originalWidth
    return {
        width: maxWidth,
        height: Math.round(originalHeight * ratio),
    }
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
