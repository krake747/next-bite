import { describe, test, expect } from "vitest"
import { render } from "vitest-browser-react"

import { Avatar, AvatarFallback, AvatarImage, AvatarPresence } from "./avatar"

describe("Avatar", () => {
    test("shows the fallback while the image loads", async () => {
        const screen = await render(
            <Avatar size="lg">
                <AvatarImage src="https://example.com/alex.jpg" alt="Alex" />
                <AvatarFallback name="Alex" />
                <AvatarPresence />
            </Avatar>,
        )
        await expect.element(screen.getByText("A")).toBeInTheDocument()
        await expect.element(screen.getByAltText("Alex")).not.toBeInTheDocument()
    })

    test("mounts the image right away with keepMounted", async () => {
        const screen = await render(
            <Avatar>
                <AvatarImage keepMounted src="https://example.com/priya.jpg" alt="Priya" />
                <AvatarFallback name="Priya" />
            </Avatar>,
        )
        await expect.element(screen.getByAltText("Priya")).toBeInTheDocument()
    })
})
