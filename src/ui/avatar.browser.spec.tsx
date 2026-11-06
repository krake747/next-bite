import { render, screen } from "@testing-library/react"
import { describe, test, expect } from "vitest"

import { Avatar, AvatarFallback, AvatarImage, AvatarPresence } from "./avatar"

describe("Avatar", () => {
    test("shows the fallback while the image loads", () => {
        render(
            <Avatar size="lg">
                <AvatarImage src="https://example.com/alex.jpg" alt="Alex" />
                <AvatarFallback name="Alex" />
                <AvatarPresence />
            </Avatar>,
        )
        expect(screen.getByText("A")).toBeInTheDocument()
        expect(screen.queryByAltText("Alex")).not.toBeInTheDocument()
    })

    test("mounts the image right away with keepMounted", () => {
        render(
            <Avatar>
                <AvatarImage keepMounted src="https://example.com/priya.jpg" alt="Priya" />
                <AvatarFallback name="Priya" />
            </Avatar>,
        )
        expect(screen.getByAltText("Priya")).toBeInTheDocument()
    })
})
