import { MAX_IMAGES } from "./constants"

export { MAX_IMAGES }

export const MAX_FILE_SIZE = 20 * 1024 * 1024

const FULL_SIZE_WIDTH = 1920

const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

type ProcessedImage = {
    blob: Blob
    originalName: string
    originalSize: number
    processedSize: number
    width: number
    height: number
}

export function validateImageFile(file: File): void {
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
        throw new Error(
            `Invalid file type. Must be one of: ${VALID_IMAGE_TYPES.map((t) => t.replace("image/", "")).join(", ")}`,
        )
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }
}

export async function processImage(
    file: File,
    options: { maxWidth?: number; quality?: number } = {},
): Promise<ProcessedImage> {
    validateImageFile(file)

    const { maxWidth = FULL_SIZE_WIDTH, quality = 0.9 } = options

    // GIFs are passed through without canvas processing to preserve animation
    if (file.type === "image/gif") {
        return {
            blob: file,
            originalName: file.name,
            originalSize: file.size,
            processedSize: file.size,
            width: 0, // Dimensions unknown without loading
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
                (blob) => {
                    if (!blob) {
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
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
