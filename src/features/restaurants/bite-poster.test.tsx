import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { BitePosterDialog } from "./bite-poster"

const restaurant = {
    name: "Mama's Dumplings",
    cuisine: "Chinese",
    location: "1 Main St",
    notes: "Great soup dumplings",
    addedBy: "Kim",
    rating: 5,
    images: [],
}

describe("BitePosterDialog", () => {
    it("renders the poster preview with restaurant details", () => {
        const onOpenChange = vi.fn<(open: boolean) => void>()
        render(<BitePosterDialog restaurant={restaurant} show={true} onOpenChange={onOpenChange} />)
        expect(screen.getByText("Mama's Dumplings")).toBeInTheDocument()
        expect(screen.getByText("Great soup dumplings")).toBeInTheDocument()
        expect(screen.getByText("Rated 6 out of 7")).toBeInTheDocument()
    })

    it("explains the missing export outside a capable browser", () => {
        const onOpenChange = vi.fn<(open: boolean) => void>()
        render(<BitePosterDialog restaurant={restaurant} show={true} onOpenChange={onOpenChange} />)
        expect(screen.getByText(/Poster download needs/)).toBeInTheDocument()
    })

    it("notifies on close", () => {
        const onOpenChange = vi.fn<(open: boolean) => void>()
        render(<BitePosterDialog restaurant={restaurant} show={true} onOpenChange={onOpenChange} />)
        fireEvent.click(screen.getByText("Close"))
        expect(onOpenChange).toHaveBeenCalledWith(false)
    })
})
