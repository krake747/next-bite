import { describe, it, expect } from "vitest"

import { validateImageFile, formatFileSize, MAX_FILE_SIZE } from "./image-utils"

describe("validateImageFile", () => {
    it("accepts valid image types", () => {
        const file = new File([""], "photo.jpg", { type: "image/jpeg" })
        expect(() => validateImageFile(file)).not.toThrow()
    })

    it("rejects invalid file types", () => {
        const file = new File([""], "doc.pdf", { type: "application/pdf" })
        expect(() => validateImageFile(file)).toThrow("Invalid file type")
    })

    it("rejects files exceeding max size", () => {
        const large = new File([new ArrayBuffer(MAX_FILE_SIZE + 1)], "huge.jpg", { type: "image/jpeg" })
        Object.defineProperty(large, "size", { value: MAX_FILE_SIZE + 1 })
        expect(() => validateImageFile(large)).toThrow("File too large")
    })
})

describe("formatFileSize", () => {
    it("formats bytes", () => {
        expect(formatFileSize(512)).toBe("512 B")
    })

    it("formats kilobytes", () => {
        expect(formatFileSize(1536)).toBe("1.5 KB")
    })

    it("formats megabytes", () => {
        expect(formatFileSize(2_500_000)).toBe("2.4 MB")
    })
})
